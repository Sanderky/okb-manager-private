import { useEffect, useState } from 'react';
import { logout as authLogout, getSession, onAuthStateChange } from '../../api';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export const useAuthService = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    getSession()
      .then((currentSession: any) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((err) => {
        console.error('Auth Session Error:', err);
        setError(err);
      })
      .finally(() => {
        setInitialLoading(false);
      });

    const unsubscribe = onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setInitialLoading(false);
      if (newSession) setError(null);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await authLogout();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err : new Error('Logout failed'));
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading: initialLoading || loading,
    initialLoading,
    error,
    logout,
  };
};
