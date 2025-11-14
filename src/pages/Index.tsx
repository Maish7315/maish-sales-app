import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, DollarSign, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import loggo from '../loggo.png';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-primary">
              <img src={loggo} alt="Maish Boutique Logo" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Maish Boutique</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button
              className="bg-gradient-primary hover:opacity-90 shadow-primary"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <h2 className="text-5xl font-bold leading-tight">
            Track Your Sales,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-brand">
              Maximize Your Earnings
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Maish Boutique's employee commission tracker. Record sales, upload receipts,
            and track your 2% commission in real-time.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 shadow-primary text-lg"
              onClick={() => navigate('/signup')}
            >
              Create Account Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Sale Entry</CardTitle>
              <CardDescription>
                Record sales in seconds with automatic 2% commission calculation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription>
                View daily totals and commission earnings with beautiful charts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Offline Support</CardTitle>
              <CardDescription>
                Record sales offline and sync automatically when connected
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto shadow-xl bg-gradient-to-br from-primary/5 to-accent/5 border-2">
            <CardHeader className="space-y-4 pb-8">
              <CardTitle className="text-3xl">Ready to Start Earning?</CardTitle>
              <CardDescription className="text-lg">
                Join your team at Maish Boutique Staff and track your commissions
              </CardDescription>
              <Button
                size="lg"
                className="bg-gradient-brand hover:opacity-90 shadow-lg text-lg"
                onClick={() => navigate('/signup')}
              >
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2025 Maish Boutique Staff. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
