export interface Task {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  module?: 'traffic' | 'social' | 'web' | 'general';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: 'pdf' | 'image' | 'doc' | 'spreadsheet';
  file_size?: number;
  category?: 'contract' | 'brief' | 'report' | 'creative';
  uploaded_by: string;
  deleted_at?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  client_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  client_id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url?: string;
  read_at?: string;
  created_at: string;
}

export interface FinancialInvoice {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  client_id?: string;
  type: 'approval' | 'task' | 'report' | 'support' | 'financial';
  title: string;
  body?: string;
  link?: string;
  read_at?: string;
  created_at: string;
}

export type FlowStatus = 'active' | 'draft';

export interface Flow {
  id: string;
  name: string;
  description?: string;
  status: FlowStatus;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export type Client = {
  id: string;
  name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  email: string;
  phone?: string | null;
  status: 'active' | 'inactive' | 'onboarding';
  modules_enabled: { traffic: boolean; social: boolean; web: boolean };
  assigned_to: string | null;
  profiles?: { full_name: string; email?: string }; // joined data from profiles
};
