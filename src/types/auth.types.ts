export type Role = 'admin' | 'client' | 'member';

export interface Permissions {
  approvals?: 'view' | 'manage';
  social?: 'view' | 'manage';
  traffic?: 'view' | 'manage';
  web?: 'view' | 'manage';
  financial?: 'view' | 'manage';
  onboarding?: 'view' | 'manage';
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
  permissions?: Permissions;
  created_at: string;
  updated_at: string;
}
