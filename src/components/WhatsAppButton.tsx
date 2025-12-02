import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSales } from '@/services/api';

export const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [allSales, setAllSales] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const checkVisibility = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hour = now.getHours();

      // Show button Monday-Saturday, 6am-10am
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
      const isBusinessHours = hour >= 6 && hour < 10; // 6am to 10am (4 hours)

      setIsVisible(isWeekday && isBusinessHours);
    };

    // Check immediately
    checkVisibility();

    // Check every minute
    const interval = setInterval(checkVisibility, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load sales data when component mounts
    const loadSalesData = async () => {
      try {
        const salesData = await getSales(user?.username || '');
        setAllSales(salesData);
      } catch (error) {
        console.error('Failed to load sales for WhatsApp report:', error);
      }
    };

    if (user) {
      loadSalesData();
    }
  }, [user]);

  const getPreviousDaySales = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    return allSales.filter(sale => {
      const saleDate = new Date(sale.created_at).toDateString();
      return saleDate === yesterdayString;
    });
  };

  const getPreviousDayName = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const generateSalesReport = () => {
    const previousDaySales = getPreviousDaySales();
    const dayName = getPreviousDayName();

    if (!user || !previousDaySales.length) {
      return `*${dayName} Sales Report - ${user?.username || 'User'}*\n\nNo sales recorded for ${dayName.toLowerCase()}.`;
    }

    let report = `*${dayName} Sales Report - ${user.username}*\n\n`;
    report += `Total Sales: ${previousDaySales.length}\n`;
    report += `Total Amount: KES ${previousDaySales.reduce((sum, sale) => sum + (sale.amount_cents / 100), 0).toFixed(2)}\n`;
    report += `Total Commission: KES ${previousDaySales.reduce((sum, sale) => sum + (sale.commission_cents / 100), 0).toFixed(2)}\n\n`;

    report += `*Sales Details:*\n`;
    previousDaySales.forEach((sale, index) => {
      const time = new Date(sale.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      report += `${index + 1}. ${sale.item_description} - KES ${(sale.amount_cents / 100).toFixed(2)} (${time})\n`;
      if (sale.photo_path) {
        report += `   📷 Receipt image attached\n`;
      }
    });

    report += `\n*Receipt Images:* Please check the attached images for all receipts.`;

    return report;
  };

  const downloadReceiptImages = () => {
    const previousDaySales = getPreviousDaySales();
    const dayName = getPreviousDayName().toLowerCase();

    previousDaySales.forEach((sale, index) => {
      if (sale.photo_path) {
        // Create a download link for each image
        const link = document.createElement('a');
        link.href = sale.photo_path;
        link.download = `${dayName}_receipt_${index + 1}_${sale.item_description.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleWhatsAppClick = () => {
    // First download all receipt images
    downloadReceiptImages();

    // WhatsApp URL format: https://wa.me/254XXXXXXXXX (Kenya country code)
    const phoneNumber = '254740297140'; // 0740297140 with Kenya country code
    const message = encodeURIComponent(generateSalesReport());
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    // Open WhatsApp in new tab with the sales report
    window.open(whatsappUrl, '_blank');
  };

  if (!isVisible) {
    return null;
  }

  const previousDaySales = getPreviousDaySales();
  const dayName = getPreviousDayName();

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse"
      size="lg"
      disabled={!previousDaySales.length}
    >
      <MessageCircle className="mr-2 h-5 w-5" />
      <Clock className="mr-2 h-4 w-4" />
      Send {dayName} Report ({previousDaySales.length} sales)
    </Button>
  );
};