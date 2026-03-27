import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, profile, role, clientId, isLoading, setUser, setProfile, clear, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function getProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          if (mounted) setProfile(null);
          return;
        }

        if (mounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Initialize session
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (mounted) setUser(session.user);
        await getProfile(session.user.id);
      } else {
        if (mounted) {
          clear();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (mounted) setUser(session.user);
        await getProfile(session.user.id);
      } else {
        if (mounted) clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, clear, setLoading]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clear();
  };

  return {
    user,
    profile,
    role,
    clientId,
    isLoading,
    signOut
  };
}
