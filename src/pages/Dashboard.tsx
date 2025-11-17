import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSalesFromStorage, cleanupOldSales, getSales } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, DollarSign, TrendingUp, Settings as SettingsIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesForm } from '@/components/SalesForm';
import { SalesList } from '@/components/SalesList';
import { toast } from 'sonner';
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

  useEffect(() => {
    if (user) {
      // Clean up old sales on component mount
      cleanupOldSales();
      loadSales();

      // Set up periodic cleanup every hour
      const cleanupInterval = setInterval(() => {
        cleanupOldSales();
        loadSales(); // Refresh the sales list after cleanup
      }, 60 * 60 * 1000); // 1 hour

      return () => clearInterval(cleanupInterval);
    }
  }, [user]);

  const loadSales = async () => {
    try {
      // Try to get sales from backend first
      const backendSales = await getSales();
      setSales(backendSales);
    } catch (backendError) {
      console.warn('Failed to load from backend, falling back to local storage:', backendError);
      try {
        // Fallback to local storage
        const storedSales = getSalesFromStorage();
        setSales(storedSales);
      } catch (localError) {
        console.error('Failed to load sales from both backend and local storage:', localError);
        toast.error('Failed to load sales data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = () => {
    loadSales();
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
                  Enter sale details and upload receipt (7:00 AM - 9:00 PM only)
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
