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
  signUp: (username: string, password: string) => Promise<void>;
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
    // Check if user is already authenticated on app load
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode token to get user info (simple decode, not full JWT verification)
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.id,
            username: payload.username,
            role: payload.role,
          });
        } catch (error) {
          // Invalid token, clear it
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Validate password format
      if (!/^\d+$/.test(password)) {
        throw new Error('Password must contain only numbers');
      }

      // Attempt backend login
      const result = await login({ username, password });

      // Set user session from backend response
      setUser({
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        avatar: result.user.avatar || undefined,
      });

      toast.success(`Welcome back ${username}! Make sure you record true sales.`, {
        duration: 5000,
      });

      // Sync local sales to backend if any exist
      try {
        const { syncLocalSalesToBackend } = await import('@/services/api');
        await syncLocalSalesToBackend();
        toast.success('Local sales synced to backend');
      } catch (error) {
        console.error('Sync failed:', error);
        // Don't throw here, login was successful
      }

      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string) => {
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

      // Attempt backend signup
      const result = await signup({ username, password });

      // Set user session from backend response
      setUser({
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        avatar: result.user.avatar || undefined,
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
      const avatarData = await saveUserAvatar(avatarFile);

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
    logout();
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
    isAuthenticated: isAuthenticated(),
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
