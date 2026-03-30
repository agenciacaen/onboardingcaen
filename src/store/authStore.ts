import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile, Role } from '../types/auth.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  clientId: string | null;
  impersonatedClientId: string | null;
  isLoading: boolean;
  /** Tracks whether the initial auth check has completed at least once */
  _initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setImpersonatedClientId: (id: string | null) => void;
  clear: () => void;
  setLoading: (isLoading: boolean) => void;
  finishLoading: () => void;
  /** Resets loading state for a fresh auth cycle (e.g. after login) */
  startAuthCycle: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  clientId: null,
  impersonatedClientId: null,
  isLoading: true,
  _initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ 
    profile, 
    role: profile?.role || null, 
    clientId: profile?.client_id || null 
  }),
  setImpersonatedClientId: (id) => set({ impersonatedClientId: id }),
  clear: () => set({ 
    user: null, 
    profile: null, 
    role: null, 
    clientId: null, 
    impersonatedClientId: null, 
    isLoading: false,
    _initialized: true,
  }),
  setLoading: (isLoading) => set({ isLoading }),
  finishLoading: () => set({ isLoading: false, _initialized: true }),
  startAuthCycle: () => set({ isLoading: true }),
}));
