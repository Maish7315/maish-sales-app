import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { DollarSign, Calendar, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface Sale {
  id: number;
  user_id: number;
  item_description: string;
  amount_cents: number;
  commission_cents: number;
  timestamp: string;
  photo_path: string | null;
  status: string;
  created_at: string;
}

interface SalesListProps {
  sales: Sale[];
  onSalesUpdate: () => void;
}

export const SalesList = ({ sales }: SalesListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (sales.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
            <p className="text-muted-foreground">
              Start recording your sales to track commissions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Sales History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sales.map((sale) => (
              <Card key={sale.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{sale.item_description}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sale.created_at), 'PPp')}
                      </div>
                    </div>
                    {sale.photo_path && (
                      <Badge variant="outline" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Receipt
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Sale Amount</p>
                      <p className="text-xl font-bold text-primary">
                        KES {(sale.amount_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission (2%)</p>
                      <p className="text-xl font-bold text-accent">
                        KES {(sale.commission_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {sale.photo_path && (
                    <div className="mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-full">
                            <img
                              src={sale.photo_path}
                              alt="Receipt"
                              className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                          <div className="relative flex items-center justify-center min-h-[200px]">
                            <img
                              src={sale.photo_path}
                              alt="Receipt - Full Size"
                              className="max-w-full max-h-[85vh] object-contain"
                              style={{ imageRendering: 'auto' }}
                            />
                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                              {sale.item_description}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
