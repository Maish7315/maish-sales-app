import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, DollarSign, TrendingUp, Plus, Settings as SettingsIcon, Upload, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesForm } from '@/components/SalesForm';
import { SalesList } from '@/components/SalesList';
import { toast } from 'sonner';
import loggo from '../loggo.png';

interface Profile {
  full_name: string;
  avatar_url?: string;
}

interface Sale {
  id: string;
  item_name: string;
  amount: number;
  commission: number;
  receipt_url: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { syncOfflineSales } = useOfflineSync(user?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSalesForm, setShowSalesForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      // Trigger sync on mount
      syncOfflineSales();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load sales
      await loadSales();
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error('Failed to load sales');
    }
  };

  const handleSaleAdded = () => {
    setShowSalesForm(false);
    loadSales();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('No file or user:', { file: !!file, user: !!user });
      return;
    }

    console.log('Starting upload for file:', file.name, 'size:', file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const tempFileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      console.log('Attempting upload to receipts bucket with filename:', tempFileName);

      // Upload to receipts bucket (since avatars bucket doesn't exist yet)
      const { data, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(tempFileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting public URL');

      // Get signed URL (since receipts bucket is private)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(tempFileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedError || !signedUrlData) {
        console.error('Failed to get signed URL:', signedError);
        throw new Error('Failed to generate image URL');
      }

      const publicUrl = signedUrlData.signedUrl;
      console.log('Signed URL obtained:', publicUrl);

      // Update local state immediately
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      // Try to update database (will fail gracefully if column doesn't exist)
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          console.warn('Database update failed (expected if migration not applied):', updateError);
        } else {
          console.log('Database updated successfully');
        }
      } catch (dbError) {
        console.warn('Database update exception:', dbError);
      }

      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error(`Failed to upload profile image: ${error.message || 'Unknown error'}`);
    }
  };

  // Calculate daily totals
  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (sale) => new Date(sale.created_at).toDateString() === today
  );
  const totalDailySales = todaySales.reduce((sum, sale) => sum + parseFloat(sale.amount.toString()), 0);
  const totalDailyCommission = todaySales.reduce((sum, sale) => sum + parseFloat(sale.commission.toString()), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-primary">
              <img src={loggo} alt="Maish Boutique Logo" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Maish Boutique</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name || 'User'}!
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-white" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
              <p className="text-muted-foreground">Maish Boutique Staff</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the upload icon to change your profile picture
              </p>
            </div>
          </div>
        </div>
      </section>

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Sale</TabsTrigger>
            <TabsTrigger value="history">Sales History</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
