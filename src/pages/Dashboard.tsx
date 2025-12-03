import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSalesFromStorage, cleanupOldSales, getSales, replaceUserSales } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, DollarSign, TrendingUp, Settings as SettingsIcon, User, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesForm } from '@/components/SalesForm';
import { SalesList } from '@/components/SalesList';
import { InstallButton } from '@/components/InstallButton';
import { WhatsAppButton } from '@/components/WhatsAppButton';
// import { WeeklyCleanupDialog } from '@/components/WeeklyCleanupDialog';
// import { useWeeklyDataCleanup } from '@/hooks/useWeeklyDataCleanup';
// Simple toast replacement
const toast = {
  success: (message: string, options?: unknown) => alert(`✅ ${message}`),
  error: (message: string, options?: unknown) => alert(`❌ ${message}`),
};
import loggo from '../loggo.png';

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

const Dashboard = () => {
  const { user, signOut, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Weekly data cleanup hook - temporarily disabled
  // const { showCleanupDialog, confirmCleanup: originalConfirmCleanup, dismissCleanup } = useWeeklyDataCleanup();

  // const confirmCleanup = async () => {
  //   await originalConfirmCleanup();
  //   // Refresh the sales list after cleanup
  //   loadSales();
  // };

  useEffect(() => {
    if (user) {
      // Clean up old sales on component mount
      cleanupOldSales(user.username);
      loadSales();

      // Set up periodic cleanup every hour
      const cleanupInterval = setInterval(() => {
        cleanupOldSales(user.username);
        loadSales(); // Refresh the sales list after cleanup
      }, 60 * 60 * 1000); // 1 hour

      return () => clearInterval(cleanupInterval);
    }
  }, [user]);

  const loadSales = async () => {
    try {
      const sales = await getSales(user?.username || '');
      setSales(sales);
    } catch (error) {
      console.error('Failed to load sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = () => {
    loadSales();
  };

  const deleteSalesByDateRange = async (startDate: string, endDate: string) => {
    if (!user) return;

    try {
      const allSales = await getSales(user.username);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate < start || saleDate > end;
      });

      // Update IndexedDB with filtered sales
      await replaceUserSales(user.username, filteredSales);

      toast.success(`Sales data deleted for the selected date range`);
      loadSales(); // Refresh the sales list
    } catch (error) {
      console.error('Failed to delete sales:', error);
      toast.error('Failed to delete sales data');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      await updateAvatar(file);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setUploadingAvatar(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate daily totals
  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (sale) => new Date(sale.created_at).toDateString() === today
  );
  const totalDailySales = todaySales.reduce((sum, sale) => sum + (sale.amount_cents / 100), 0);
  const totalDailyCommission = todaySales.reduce((sum, sale) => sum + (sale.commission_cents / 100), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-primary">
              <img src={loggo} alt="Maish Boutique Logo" className="h-6 w-6 object-contain" />
            </div>
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">Maish Boutique</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user?.username || 'User'}!
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <WhatsAppButton />
            <InstallButton />
            <Button
              variant="outline"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                KES {totalDailySales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {todaySales.length} transaction{todaySales.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                KES {totalDailyCommission.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                2% of total sales
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sales.length}
              </div>
              <p className="text-xs text-muted-foreground">
                All time transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Management */}
        <Tabs defaultValue="add" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add Sale</TabsTrigger>
            <TabsTrigger value="history">Sales History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Record New Sale</CardTitle>
                <CardDescription>
                  Enter sale details and upload receipt image (all fields required - 7:00 AM - 9:00 PM only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesForm onSaleAdded={handleSaleAdded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <SalesList sales={sales} onSalesUpdate={loadSales} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your profile picture and manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Profile Picture</Label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-4 border-primary"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-primary">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="max-w-xs"
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload a profile picture (max 5MB)
                      </p>
                      {uploadingAvatar && (
                        <p className="text-sm text-primary">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Account Information</Label>
                  <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={user?.username || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user?.role || 'User'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Management Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Data Management</Label>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Sales Data
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a date range to permanently delete sales data. This action cannot be undone.
                      </p>
                      <div className="grid gap-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            className="max-w-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            className="max-w-xs"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
                            const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;

                            if (!startDate || !endDate) {
                              toast.error('Please select both start and end dates');
                              return;
                            }

                            if (new Date(startDate) > new Date(endDate)) {
                              toast.error('Start date must be before end date');
                              return;
                            }

                            if (window.confirm(`Are you sure you want to delete all sales data between ${startDate} and ${endDate}? This action cannot be undone.`)) {
                              deleteSalesByDateRange(startDate, endDate);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Data
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data Statistics
                      </h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Sales Records:</span>
                          <span className="font-medium">{sales.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Oldest Record:</span>
                          <span className="font-medium">
                            {sales.length > 0 ? new Date(Math.min(...sales.map(s => new Date(s.created_at).getTime()))).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Newest Record:</span>
                          <span className="font-medium">
                            {sales.length > 0 ? new Date(Math.max(...sales.map(s => new Date(s.created_at).getTime()))).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Weekly Cleanup Dialog - temporarily disabled */}
      {/* <WeeklyCleanupDialog
        open={showCleanupDialog}
        onConfirm={confirmCleanup}
        onCancel={dismissCleanup}
      /> */}
    </div>
  );
};

export default Dashboard;
