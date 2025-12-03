import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Simple toast replacement
const toast = {
  success: (message: string, options?: unknown) => alert(`✅ ${message}`),
  error: (message: string, options?: unknown) => alert(`❌ ${message}`),
};
import { Loader2, Store, HelpCircle } from 'lucide-react';
import { z } from 'zod';
import { resetPassword } from '@/services/api';

const loginSchema = z.object({
  username: z.string().trim().min(2, { message: 'Username must be at least 2 characters' }).max(100),
  password: z.string().regex(/^\d+$/, { message: 'Password must contain only numbers' }).min(4, { message: 'Password must be at least 4 digits' }),
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetIdNumber, setResetIdNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = loginSchema.parse({ username, password });
      setLoading(true);

      await signIn(validated.username, validated.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!/^\d+$/.test(newPassword)) {
        toast.error('New password must contain only numbers');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (newPassword.length < 4) {
        toast.error('New password must be at least 4 digits');
        return;
      }

      setResetLoading(true);
      await resetPassword(resetIdNumber, newPassword);
      
      toast.success('Password reset successfully! Please sign in with your new password.');
      setShowResetForm(false);
      setResetIdNumber('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-primary">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Maish Boutique</CardTitle>
          <CardDescription className="text-base">
            Sign in to track your sales and commissions
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (Numbers Only)</Label>
              <Input
                id="password"
                type="password"
                placeholder="123456"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 shadow-primary transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <div className="flex flex-col gap-2 text-center">
              {!showResetForm ? (
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary"
                  disabled={loading}
                  onClick={() => setShowResetForm(true)}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Forgot your password?
                </Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <h3 className="font-semibold text-center">Reset Password</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter your ID number and create a new password
                  </p>
                  <form onSubmit={handlePasswordReset} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="resetIdNumber">ID Number</Label>
                      <Input
                        id="resetIdNumber"
                        type="text"
                        placeholder="Enter your ID number"
                        value={resetIdNumber}
                        onChange={(e) => setResetIdNumber(e.target.value)}
                        required
                        disabled={resetLoading}
                        minLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password (Numbers Only)</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={resetLoading}
                        minLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        disabled={resetLoading}
                        minLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowResetForm(false)}
                        disabled={resetLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-gradient-primary hover:opacity-90"
                      >
                        {resetLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
