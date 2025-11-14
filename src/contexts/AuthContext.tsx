import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    // First, try to determine if identifier is an email or name
    const isEmail = identifier.includes('@');

    const email = isEmail ? identifier : null;

    if (!isEmail) {
      // Look up email by name from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('full_name', identifier)
        .single();

      if (profileError || !profile?.email) {
        return { error: { message: 'Invalid name or password' } };
      }

      const lookedUpEmail = profile.email;

      const { error } = await supabase.auth.signInWithPassword({
        email: lookedUpEmail,
        password,
      });

      if (!error) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }

      return { error };
    }

    // Direct email login
    const { error } = await supabase.auth.signInWithPassword({
      email: email!,
      password,
    });

    if (!error) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Store email in profiles table for name-based login
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', data.user.id);

      if (profileError) {
        console.warn('Failed to store email in profile:', profileError);
      }

      toast.success('Account created successfully! Remember your name and password for login.');
      navigate('/dashboard');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
