import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile, Role } from '../types/auth.types';
import type { Client } from '../types/client.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  clientId: string | null;
  activeClient: Client | null;
  impersonatedClientId: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setActiveClient: (client: Client | null) => void;
  setImpersonatedClientId: (id: string | null) => void;
  clear: () => void;
  setLoading: (isLoading: boolean) => void;
  finishLoading: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  clientId: null,
  activeClient: null,
  impersonatedClientId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ 
    profile, 
    role: profile?.role || null, 
    clientId: profile?.client_id || null,
    activeClient: profile?.client || null
  }),
  setActiveClient: (client) => set({ activeClient: client }),
  setImpersonatedClientId: (id) => set({ impersonatedClientId: id }),
  clear: () => set({ 
    user: null, 
    profile: null, 
    role: null, 
    clientId: null, 
    activeClient: null,
    impersonatedClientId: null, 
    isLoading: false 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  finishLoading: () => set({ isLoading: false }),
}));
