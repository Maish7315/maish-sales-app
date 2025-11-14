import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSales } from '@/services/api';
import { Button } from '@/components/ui/button';
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSales();
    }
  }, [user]);

  const loadSales = async () => {
    try {
      const salesData = await getSales();
      setSales(salesData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = () => {
    loadSales();
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
            <div>
              <h1 className="text-xl font-bold">Maish Boutique</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user?.username || 'User'}!
              </p>
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
