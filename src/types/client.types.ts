export type ClientStatus = 'active' | 'inactive' | 'onboarding';

export interface ModulesEnabled {
  traffic: boolean;
  social: boolean;
  web: boolean;
}

export interface Client {
  id: string;
  name: string;
  legal_name?: string;
  cnpj?: string;
  email: string;
  phone?: string;
  logo_url?: string;
  status: ClientStatus;
  assigned_to?: string;
  modules_enabled: ModulesEnabled;
  onboarding_step: number;
  onboarding_completed: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}
