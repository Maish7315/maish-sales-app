import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getSalesFromStorage } from '@/services/api';

const CLEANUP_CHECK_KEY = 'last_cleanup_check';
const CLEANUP_CONFIRMED_KEY = 'cleanup_confirmed';

export const useWeeklyDataCleanup = () => {
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isCleanupPending, setIsCleanupPending] = useState(false);

  useEffect(() => {
    const checkForWeeklyCleanup = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
      const hour = now.getHours();

      // Check if it's Monday between 6am-7am
      if (dayOfWeek === 1 && hour >= 6 && hour < 7) {
        const lastCheck = localStorage.getItem(CLEANUP_CHECK_KEY);
        const today = now.toDateString();

        // Only show dialog once per day
        if (lastCheck !== today) {
          const sales = getSalesFromStorage();
          if (sales.length > 0) {
            setIsCleanupPending(true);
            setShowCleanupDialog(true);
            localStorage.setItem(CLEANUP_CHECK_KEY, today);
          }
        }
      }
    };

    // Check immediately and then every 5 minutes
    checkForWeeklyCleanup();
    const interval = setInterval(checkForWeeklyCleanup, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const confirmCleanup = () => {
    // Clear all sales data
    localStorage.removeItem('maish_sales_data');
    localStorage.removeItem('maish_user_credentials');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('maish_offline_sales');

    // Mark as confirmed
    localStorage.setItem(CLEANUP_CONFIRMED_KEY, 'true');

    setShowCleanupDialog(false);
    setIsCleanupPending(false);

    toast.success('Weekly data cleanup completed successfully!');
  };

  const dismissCleanup = () => {
    setShowCleanupDialog(false);
    setIsCleanupPending(false);
    toast.info('Data cleanup postponed. You can clean up manually later.');
  };

  return {
    showCleanupDialog,
    isCleanupPending,
    confirmCleanup,
    dismissCleanup,
  };
};