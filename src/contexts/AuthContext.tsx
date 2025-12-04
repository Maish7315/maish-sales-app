import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, logout, getUserAvatar, saveUserAvatar, removeUserAvatar, isWeakPassword } from '@/services/api';
import { supabase } from '@/lib/supabase';

// Simple toast replacement
const toast = {
  success: (message: string, options?: unknown) => alert(`✅ ${message}`),
  error: (message: string, options?: unknown) => alert(`❌ ${message}`),
};

interface User {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, fullName: string, password: string, phoneNumber: string) => Promise<void>;
  updateAvatar: (avatarFile: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Get initial session and profile in one call
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profile && !profileError && mounted) {
            setUser({
              id: session.user.id,
              username: profile.username,
              role: 'user',
              avatar: profile.avatar_url || undefined,
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          // User is signed in - fetch profile with retry logic
          let retries = 0;
          const maxRetries = 5;

          const fetchProfile = async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', session.user.id)
                .single();

              if (profile && !error && mounted) {
                setUser({
                  id: session.user.id,
                  username: profile.username,
                  role: 'user',
                  avatar: profile.avatar_url || undefined,
                });
                return true; // Success
              } else if (retries < maxRetries) {
                // Profile not ready yet, retry after delay
                retries++;
                setTimeout(fetchProfile, 1000 * retries); // Exponential backoff
                return false;
              } else {
                console.error('Profile fetch failed after retries:', error);
                // Set user with basic info if profile fetch fails
                if (mounted) {
                  setUser({
                    id: session.user.id,
                    username: session.user.user_metadata?.username || 'User',
                    role: 'user',
                    avatar: undefined,
                  });
                }
                return false;
              }
            } catch (error) {
              console.error('Profile fetch error:', error);
              if (retries < maxRetries) {
                retries++;
                setTimeout(fetchProfile, 1000 * retries);
                return false;
              }
              return false;
            }
          };

          fetchProfile();
        } else {
          // User is signed out
          setUser(null);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Attempt login - Supabase auth state change will update user
      await login({ username, password });

      toast.success(`Welcome back ${username}! Make sure you record true sales.`, {
        duration: 5000,
      });

      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, fullName: string, password: string, phoneNumber: string) => {
    try {
      setLoading(true);

      // Attempt signup - Supabase auth state change will handle user creation
      await signup({ username, full_name: fullName, password, phoneNumber });

      toast.success(`Account created successfully! Please sign in with your credentials.`, {
        duration: 5000,
      });
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (avatarFile: File) => {
    try {
      // Don't set loading here as it's handled in Dashboard component
      const avatarData = await saveUserAvatar(avatarFile, user?.username || '');

      // Update user state with new avatar
      if (user) {
        setUser({
          ...user,
          avatar: avatarData,
        });
      }

      toast.success('Avatar updated successfully!');
      return avatarData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update avatar';
      toast.error(message);
      throw error;
    }
  };

  const removeAvatar = async () => {
    try {
      await removeUserAvatar(user?.username || '');

      // Update user state to remove avatar
      if (user) {
        setUser({
          ...user,
          avatar: undefined,
        });
      }

      toast.success('Avatar removed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove avatar';
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout();
      // Supabase auth state change will clear the user
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear user state even if logout fails
      setUser(null);
      navigate('/');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    updateAvatar,
    removeAvatar,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
