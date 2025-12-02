import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login, signup, logout, isAuthenticated, getUserAvatar, saveUserAvatar, saveUserCredentials, getUserCredentials, validateUserCredentials, isWeakPassword } from '@/services/api';

interface User {
  id: number;
  username: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, fullName: string, password: string) => Promise<void>;
  updateAvatar: (avatarFile: File) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto sign-out when user leaves the app
    const handleBeforeUnload = () => {
      signOut();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized - sign out after a delay
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            signOut();
          }
        }, 30000); // 30 seconds delay
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check if user is already authenticated on app load
    const checkAuth = () => {
      const credentials = getUserCredentials();
      if (credentials) {
        setUser({
          id: 1,
          username: credentials.username,
          role: 'user',
          avatar: getUserAvatar(credentials.username) || undefined,
        });
      }
      setLoading(false);
    };

    checkAuth();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Validate password format
      if (!/^\d+$/.test(password)) {
        throw new Error('Password must contain only numbers');
      }

      // Attempt login
      await login({ username, password });

      // Set user session and load persisted data
      setUser({
        id: 1,
        username: username,
        role: 'user',
        avatar: getUserAvatar(username) || undefined,
      });

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

  const signUp = async (username: string, fullName: string, password: string) => {
    try {
      setLoading(true);

      // Validate password format
      if (!/^\d+$/.test(password)) {
        throw new Error('Password must contain only numbers');
      }

      // Check for weak passwords
      if (isWeakPassword(password)) {
        throw new Error('Password is too weak. Please choose a different combination');
      }

      // Attempt signup
      await signup({ username, full_name: fullName, password });

      // Set user session for front-end only
      setUser({
        id: 1,
        username: username,
        role: 'user',
        avatar: undefined,
      });

      toast.success(`Congratulations ${username}! Welcome. Make sure you record true sales.`, {
        duration: 5000,
      });
      navigate('/dashboard');
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
      setLoading(true);
      const avatarData = await saveUserAvatar(avatarFile, user?.username || '');

      // Update user state with new avatar
      if (user) {
        setUser({
          ...user,
          avatar: avatarData,
        });
      }

      toast.success('Avatar updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update avatar';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    // Clear user session but keep data
    setUser(null);
    toast.success('Signed out successfully');
    navigate('/');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    updateAvatar,
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
