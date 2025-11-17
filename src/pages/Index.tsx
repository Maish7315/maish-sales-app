import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, DollarSign, TrendingUp, Users, ArrowRight, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import loggo from '../loggo.png';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Removed automatic redirect to dashboard so users can see the nav bar with avatar

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('appinstalled event fired');
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is already installed (standalone mode)');
      setIsInstallable(false);
    } else {
      console.log('App is not installed, checking for installability');
      // Check if it's a mobile device that supports PWA
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isMobile && (isIOS || isAndroid)) {
        console.log('Mobile device detected, showing install button');
        setIsInstallable(true);
      } else {
        // For desktop or other devices, wait for beforeinstallprompt or show after delay
        setTimeout(() => {
          if (!deferredPrompt && !isMobile) {
            console.log('No deferred prompt on desktop, showing button');
            setIsInstallable(true);
          }
        }, 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for mobile devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isIOS) {
        alert('To install on iOS: Tap the Share button (📤) at the bottom of the screen, then select "Add to Home Screen".');
      } else if (isAndroid) {
        alert('To install on Android: Look for the "Add to Home Screen" banner at the top of the page, or tap the menu (⋮) and select "Add to Home Screen".');
      } else {
        alert('Please use your browser\'s install button (usually in the address bar) to install the app.');
      }
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-primary">
              <img src={loggo} alt="Maish Boutique Logo" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Maish Boutique</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-primary hover:opacity-90 shadow-primary"
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {user ? (
          /* Welcome back section for logged-in users */
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="flex justify-center mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-brand rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">
                Welcome back, <span className="text-primary">{user.username}!</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Ready to track your sales and commissions?
              </p>
              <div className="flex gap-4 justify-center pt-6">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 shadow-primary text-lg"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  View Sales History
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Marketing content for non-logged-in users */
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
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
            <div className="flex gap-4 justify-center pt-4 flex-wrap">
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
        )}

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

        {/* Download Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold mb-8">Download the App</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Install as a web app for the best experience on your device
          </p>
          {isInstallable ? (
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 shadow-lg text-lg"
              onClick={handleInstallClick}
            >
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          ) : (
            <div className="text-muted-foreground space-y-2">
              <p className="font-medium">Installation Instructions:</p>
              <div className="text-sm space-y-1">
                <p><strong>iOS (Safari):</strong> Tap Share button → "Add to Home Screen"</p>
                <p><strong>Android (Chrome):</strong> Look for "Add to Home Screen" banner or tap menu → "Add to Home Screen"</p>
                <p><strong>Desktop:</strong> Click the install icon in the address bar</p>
              </div>
            </div>
          )}
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
