import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, User, Lock, LogOut, Wifi, WifiOff, Camera, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageCropper } from '@/components/ImageCropper';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [avatarToCrop, setAvatarToCrop] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
    loadAvatar();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProfile = async () => {
    // Profile loading disabled - backend integration needed
    // try {
    //   const { data, error } = await supabase
    //     .from('profiles')
    //     .select('full_name')
    //     .eq('id', user?.id)
    //     .single();

    //   if (error) throw error;
    //   setFullName(data.full_name);
    // } catch (error: any) {
    //   toast.error('Failed to load profile');
    // }
  };

  const loadAvatar = () => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      // Check if file is too large and needs cropping
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for avatars
        setAvatarToCrop(file);
        setShowAvatarCropper(true);
      } else {
        // Convert to base64 and save
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setAvatar(result);
          localStorage.setItem('userAvatar', result);
          toast.success('Avatar updated successfully!');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAvatarCropComplete = (croppedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      localStorage.setItem('userAvatar', result);
      toast.success('Avatar updated successfully!');
    };
    reader.readAsDataURL(croppedFile);
    setShowAvatarCropper(false);
    setAvatarToCrop(null);
  };

  const handleAvatarCropCancel = () => {
    setShowAvatarCropper(false);
    setAvatarToCrop(null);
    // Clear the file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const removeAvatar = () => {
    setAvatar(null);
    localStorage.removeItem('userAvatar');
    toast.success('Avatar removed successfully!');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Profile update disabled - backend integration needed
    // try {
    //   const { error } = await supabase
    //     .from('profiles')
    //     .update({ full_name: fullName.trim() })
    //     .eq('id', user?.id);

    //   if (error) throw error;
    //   toast.success('Profile updated successfully');
    // } catch (error: any) {
    //   toast.error(error.message || 'Failed to update profile');
    // } finally {
    //   setLoading(false);
    // }
    toast.info('Profile update not available - backend integration required');
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Password change disabled - backend integration needed
    // try {
    //   const { error } = await supabase.auth.updateUser({
    //     password: newPassword,
    //   });

    //   if (error) throw error;

    //   toast.success('Password changed successfully');
    //   setNewPassword('');
    //   setConfirmPassword('');
    // } catch (error: any) {
    //   toast.error(error.message || 'Failed to change password');
    // } finally {
    //   setLoading(false);
    // }
    toast.info('Password change not available - backend integration required');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Connection Status */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  Connection Status
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-destructive" />
                  Connection Status
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? 'Online' : 'Offline - Sales will sync when reconnected'}
            </Badge>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Avatar Section */}
            <div className="flex items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {avatar && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeAvatar}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="text-sm font-medium">
                  Profile Picture
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a profile picture. Large images will be cropped.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {avatar ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-primary hover:opacity-90 shadow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="shadow-md border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Sign Out
            </CardTitle>
            <CardDescription>End your current session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={signOut}
              className="w-full"
            >
              Sign Out of Account
            </Button>
          </CardContent>
        </Card>

        {/* Avatar Cropper Modal */}
        {showAvatarCropper && avatarToCrop && (
          <ImageCropper
            imageFile={avatarToCrop}
            onCropComplete={handleAvatarCropComplete}
            onCancel={handleAvatarCropCancel}
            maxSizeMB={2}
          />
        )}
      </main>
    </div>
  );
};

export default Settings;
