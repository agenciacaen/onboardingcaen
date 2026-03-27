import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, profile, role, clientId, isLoading, clear } = useAuthStore();

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
