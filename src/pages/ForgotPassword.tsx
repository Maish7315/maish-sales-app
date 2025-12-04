import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Phone, KeyRound } from 'lucide-react';
import { z } from 'zod';

// Simple toast replacement
const toast = {
  success: (message: string, options?: unknown) => alert(`✅ ${message}`),
  error: (message: string, options?: unknown) => alert(`❌ ${message}`),
};

const phoneSchema = z.object({
  phoneNumber: z.string().trim().min(10, { message: 'Phone number must be at least 10 digits' }).max(15),
});

const otpSchema = z.object({
  otp: z.string().trim().min(6, { message: 'OTP must be 6 digits' }).max(6),
});

const passwordSchema = z.object({
  newPassword: z.string().regex(/^\d+$/, { message: 'Password must contain only numbers' }).min(4, { message: 'Password must be at least 4 digits' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ForgotPassword = () => {
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = phoneSchema.parse({ phoneNumber });
      setLoading(true);

      toast.success('Sending verification code...');
      const result = await sendPasswordResetOTP(validated.phoneNumber);

      if (result.success) {
        toast.success('Verification code sent! Please check your phone.');
        setStep('otp');
      }
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedOtp = otpSchema.parse({ otp });
      setLoading(true);

      toast.success('Verifying code...');

      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: validatedOtp.otp,
        type: 'sms'
      });

      if (error) {
        throw new Error('Invalid verification code. Please try again.');
      }

      toast.success('Code verified! Please set your new password.');
      setStep('password');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = passwordSchema.parse({ newPassword, confirmPassword });
      setLoading(true);

      toast.success('Resetting password...');

      // Update password using Supabase Auth (user is now authenticated from OTP verification)
      const { error: updateError } = await supabase.auth.updateUser({
        password: validated.newPassword
      });

      if (updateError) {
        throw new Error('Failed to update password. Please try again.');
      }

      // Sign out the temporary session
      await supabase.auth.signOut();

      toast.success('Password reset successfully! Please sign in with your new password.');

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
    } else if (step === 'password') {
      setStep('otp');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-primary">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-base">
            {step === 'phone' && 'Enter your phone number to receive a verification code'}
            {step === 'otp' && 'Enter the 6-digit code sent to your phone'}
            {step === 'password' && 'Create your new password'}
          </CardDescription>
        </CardHeader>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                    minLength={10}
                    inputMode="tel"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the phone number associated with your account
                </p>
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
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
              <Link to="/login" className="text-sm text-center text-muted-foreground hover:text-primary">
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Back to Sign In
              </Link>
            </CardFooter>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  required
                  disabled={loading}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 shadow-primary transition-all duration-300"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Change Phone Number
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password (Numbers Only)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="123456"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={4}
                  autoComplete="new-password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="123456"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={4}
                  autoComplete="new-password"
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
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Code Entry
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;