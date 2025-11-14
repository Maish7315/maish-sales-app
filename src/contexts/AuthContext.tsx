import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login, signup, logout, isAuthenticated } from '@/services/api';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, fullName: string, password: string) => Promise<void>;
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
      const result = await login({ username, password });

      if (result.token) {
        // Decode token to get user info
        const payload = JSON.parse(atob(result.token.split('.')[1]));
        setUser({
          id: payload.id,
          username: payload.username,
          role: payload.role,
        });

        toast.success('Welcome back!');
        navigate('/dashboard');
      }
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
      const result = await signup({ username, full_name: fullName, password });

      if (result.token) {
        // Decode token to get user info
        const payload = JSON.parse(atob(result.token.split('.')[1]));
        setUser({
          id: payload.id,
          username: payload.username,
          role: payload.role,
        });

        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
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
