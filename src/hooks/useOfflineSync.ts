import { useEffect, useState } from 'react';
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
      // No sync needed in front-end only mode
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are offline. Sales will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

      toast.success('Sale saved locally.');
      return { success: true };
    } catch (error) {
      console.error('Failed to save offline sale:', error);
      toast.error('Failed to save sale locally');
      return { success: false, error };
    }
  };

  const syncOfflineSales = async () => {
    // No sync in front-end only mode
    return;
  };

  return {
    isOnline,
    syncing,
    saveOfflineSale,
    syncOfflineSales,
    getOfflineSales,
  };
};
