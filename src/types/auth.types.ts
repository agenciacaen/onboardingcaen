export type Role = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  client_id?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
