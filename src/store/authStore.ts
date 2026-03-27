import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile, Role } from '../types/auth.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  clientId: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  clear: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  clientId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ 
    profile, 
    role: profile?.role || null, 
    clientId: profile?.client_id || null 
  }),
  clear: () => set({ user: null, profile: null, role: null, clientId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading })
}));
