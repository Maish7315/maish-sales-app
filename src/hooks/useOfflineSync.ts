import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineSale {
  id: string;
  user_id: string;
  item_name: string;
  amount: number;
  commission: number;
  receipt_file?: File;
  created_at: string;
}

const OFFLINE_SALES_KEY = 'maish_offline_sales';

export const useOfflineSync = (userId: string | undefined) => {
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineSales();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are offline. Sales will be saved locally and synced when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync on mount if online
    if (navigator.onLine) {
      syncOfflineSales();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getOfflineSales = (): OfflineSale[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_SALES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline sales:', error);
      return [];
    }
  };

  const saveOfflineSale = async (sale: Omit<OfflineSale, 'id' | 'created_at'>) => {
    try {
      const offlineSales = getOfflineSales();
      const newSale: OfflineSale = {
        ...sale,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      
      offlineSales.push(newSale);
      localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(offlineSales));
      
      toast.success('Sale saved offline. Will sync when connected.');
      return { success: true };
    } catch (error) {
      console.error('Failed to save offline sale:', error);
      toast.error('Failed to save sale offline');
      return { success: false, error };
    }
  };

  const syncOfflineSales = async () => {
    if (!userId || syncing) return;

    const offlineSales = getOfflineSales();
    if (offlineSales.length === 0) return;

    setSyncing(true);
    let successCount = 0;
    const failedSales: OfflineSale[] = [];

    for (const sale of offlineSales) {
      try {
        let receiptUrl = null;

        // Upload receipt if exists
        if (sale.receipt_file) {
          const fileExt = sale.receipt_file.name?.split('.').pop() || 'jpg';
          const fileName = `${userId}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, sale.receipt_file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('receipts')
              .getPublicUrl(fileName);
            receiptUrl = publicUrl;
          }
        }

        // Insert sale
        const { error: insertError } = await supabase
          .from('sales')
          .insert({
            user_id: userId,
            item_name: sale.item_name,
            amount: sale.amount,
            commission: sale.commission,
            receipt_url: receiptUrl,
            created_at: sale.created_at,
            synced: true,
          });

        if (insertError) {
          throw insertError;
        }

        successCount++;
      } catch (error) {
        console.error('Failed to sync sale:', error);
        failedSales.push(sale);
      }
    }

    // Update localStorage with only failed sales
    localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(failedSales));

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline sale${successCount > 1 ? 's' : ''}`);
    }

    if (failedSales.length > 0) {
      toast.error(`Failed to sync ${failedSales.length} sale${failedSales.length > 1 ? 's' : ''}`);
    }

    setSyncing(false);
  };

  return {
    isOnline,
    syncing,
    saveOfflineSale,
    syncOfflineSales,
    getOfflineSales,
  };
};
