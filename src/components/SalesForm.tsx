import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSale } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { z } from 'zod';

const saleSchema = z.object({
  itemName: z.string().trim().min(1, { message: 'Item name is required' }).max(200),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
});

interface SalesFormProps {
  onSaleAdded: () => void;
}

export const SalesForm = ({ onSaleAdded }: SalesFormProps) => {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const isWithinBusinessHours = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 7 && hours < 21;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit to match backend
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWithinBusinessHours()) {
      toast.error('Sales can only be recorded between 7:00 AM and 9:00 PM');
      return;
    }

    try {
      const validated = saleSchema.parse({
        itemName: itemName.trim(),
        amount: parseFloat(amount),
      });

      setLoading(true);

      // Calculate commission (2%)
      const commission = validated.amount * 0.02;

      // Create sale using our API
      await createSale({
        itemName: validated.itemName,
        amount: validated.amount,
      }, receiptFile || undefined);

      toast.success(`Sale recorded! Commission: KES ${commission.toFixed(2)}`);

      // Reset form
      setItemName('');
      setAmount('');
      setReceiptFile(null);

      onSaleAdded();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to record sale');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="itemName">Item Name / Description</Label>
        <Input
          id="itemName"
          type="text"
          placeholder="e.g., Blue Dress, Shoes"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Sale Amount (KES)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={loading}
        />
        {amount && parseFloat(amount) > 0 && (
          <p className="text-sm text-muted-foreground">
            Commission (2%): <span className="font-semibold text-accent">
              KES {(parseFloat(amount) * 0.02).toFixed(2)}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt">Receipt Image (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="receipt"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={loading}
            className="flex-1"
          />
          {receiptFile && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setReceiptFile(null)}
              disabled={loading}
            >
              ✕
            </Button>
          )}
        </div>
        {receiptFile && (
          <p className="text-sm text-muted-foreground">
            {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-primary hover:opacity-90 shadow-primary transition-all duration-300"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Recording Sale...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Record Sale
          </>
        )}
      </Button>
    </form>
  );
};
