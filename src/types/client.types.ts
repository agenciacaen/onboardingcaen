export type ClientStatus = 'active' | 'inactive' | 'onboarding';

export interface ModulesEnabled {
  traffic: boolean;
  social: boolean;
  web: boolean;
}

export interface Client {
  id: string;
  name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  email: string;
  phone?: string | null;
  logo_url?: string;
  status: ClientStatus;
  assigned_to: string | null;
  modules_enabled: ModulesEnabled;
  onboarding_step: number;
  onboarding_completed: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithProfile extends Client {
  profiles?: { full_name: string; email?: string | null };
}
