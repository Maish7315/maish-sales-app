import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { DollarSign, Calendar, Image as ImageIcon, X, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const salesWithImages = sales.filter(sale => sale.photo_path).length;

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return sales.filter(sale => new Date(sale.created_at).toDateString() === today);
  };

  const todaysSales = getTodaysSales();
  const todaysSalesWithImages = todaysSales.filter(sale => sale.photo_path).length;

  const generateSalesReport = (salesData = todaysSales) => {
    if (!user || !salesData.length) {
      return `*Daily Sales Report - ${user?.username || 'User'}*\n\nNo sales recorded today.`;
    }

    let report = `*Daily Sales Report - ${user.username}*\n\n`;
    report += `📊 *Summary:*\n`;
    report += `• Total Sales: ${salesData.length}\n`;
    report += `• Total Amount: KES ${salesData.reduce((sum, sale) => sum + (sale.amount_cents / 100), 0).toFixed(2)}\n`;
    report += `• Total Commission: KES ${salesData.reduce((sum, sale) => sum + (sale.commission_cents / 100), 0).toFixed(2)}\n\n`;

    report += `*📝 Sales Details:*\n`;
    salesData.forEach((sale, index) => {
      const time = new Date(sale.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const date = format(new Date(sale.created_at), 'MMM dd');
      report += `${index + 1}. *${sale.item_description}*\n`;
      report += `   💰 Amount: KES ${(sale.amount_cents / 100).toFixed(2)}\n`;
      report += `   📈 Commission: KES ${(sale.commission_cents / 100).toFixed(2)}\n`;
      report += `   📅 Date/Time: ${date} ${time}\n`;
      if (sale.photo_path) {
        report += `   📷 Receipt Image: Available (please attach)\n`;
      }
      report += `\n`;
    });

    const salesWithImages = salesData.filter(sale => sale.photo_path).length;
    if (salesWithImages > 0) {
      report += `*🖼️ Receipt Images:*\n`;
      report += `Please attach ${salesWithImages} receipt image(s) with this message.\n`;
      report += `Images have been downloaded to your device for easy attachment.\n\n`;
    }

    report += `*📱 Sent from Maish Boutique Sales Tracker*`;

    return report;
  };

  const downloadReceiptImages = (salesData = todaysSales) => {
    salesData.forEach((sale, index) => {
      if (sale.photo_path) {
        const link = document.createElement('a');
        link.href = sale.photo_path;
        link.download = `receipt_${index + 1}_${sale.item_description.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleWhatsAppClick = () => {
    downloadReceiptImages(todaysSales);
    const phoneNumber = '254740297140';
    const message = encodeURIComponent(generateSalesReport(todaysSales));
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleImagesOnlyClick = () => {
    downloadReceiptImages(todaysSales);
    const phoneNumber = '254740297140';
    const message = encodeURIComponent(`*Receipt Images - ${user?.username || 'User'}*\n\nHere are ${todaysSalesWithImages} receipt image(s) from today's sales.\n\n*📱 Sent from Maish Boutique Sales Tracker*`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSummaryOnlyClick = () => {
    const phoneNumber = '254740297140';
    const message = encodeURIComponent(generateSalesReport(todaysSales));
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };


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
    <>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle>Sales History</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleWhatsAppClick}
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
                disabled={!todaysSales.length}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Today's Sales Report with Images
              </Button>
              <Button
                onClick={handleImagesOnlyClick}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
                disabled={!todaysSalesWithImages}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Send Today's Receipt Images Only
              </Button>
              <Button
                onClick={handleSummaryOnlyClick}
                className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
                disabled={!todaysSales.length}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Today's Sales Summary Only
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Today's Sales Report with Images:</strong> Sends today's complete sales details with receipt images attached</p>
              <p><strong>Today's Receipt Images Only:</strong> Sends only today's receipt images for sales with photos</p>
              <p><strong>Today's Sales Summary Only:</strong> Sends today's sales summary text without images</p>
            </div>
          </div>
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
                        <button
                          className="w-full group"
                          onClick={() => setSelectedImage(sale.photo_path)}
                        >
                          <div className="relative overflow-hidden rounded-lg border">
                            <img
                              src={sale.photo_path}
                              alt="Receipt"
                              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Click to view full size
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-[95vh] w-full">
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 border-white/20 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent z-10 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-semibold text-lg">
                    {sales.find(s => s.photo_path === selectedImage)?.item_description || 'Receipt'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {sales.find(s => s.photo_path === selectedImage) && 
                      format(new Date(sales.find(s => s.photo_path === selectedImage)!.created_at), 'PPp')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Amount</p>
                  <p className="font-bold text-lg">
                    {sales.find(s => s.photo_path === selectedImage) && 
                      `KES ${(sales.find(s => s.photo_path === selectedImage)!.amount_cents / 100).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Full Size Image */}
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={selectedImage}
                alt="Receipt - Full Size"
                className="max-w-full max-h-[85vh] object-contain"
                style={{ 
                  imageRendering: 'crisp-edges',
                  filter: 'contrast(1.1) brightness(1.05)'
                }}
              />
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent z-10 p-4">
              <div className="flex items-center justify-between text-white text-sm">
                <span>
                  Commission: {sales.find(s => s.photo_path === selectedImage) && 
                    `KES ${(sales.find(s => s.photo_path === selectedImage)!.commission_cents / 100).toFixed(2)}`}
                </span>
                <span>
                  Sale ID: #{sales.find(s => s.photo_path === selectedImage)?.id || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
