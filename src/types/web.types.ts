export interface Page {
  id: string;
  client_id: string;
  title: string;
  url?: string;
  page_type?: 'landing' | 'blog' | 'product' | 'home';
  status: 'active' | 'draft' | 'maintenance';
  seo_score?: number;
  last_audit_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  client_id: string;
  page_id?: string;
  audit_date: string;
  seo_score?: number;
  performance_score?: number;
  accessibility_score?: number;
  issues?: Record<string, unknown>;
  recommendations?: Record<string, unknown>;
  conducted_by?: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  delivery_type?: 'page' | 'feature' | 'fix' | 'integration';
  status: 'planned' | 'in_progress' | 'delivered' | 'approved';
  delivered_at?: string;
  due_date?: string;
  file_urls?: string[];
  delivered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WebOverview {
  active_pages: number;
  avg_seo_score: number;
  deliveries_completed: number;
  deliveries_in_progress: number;
  last_audit?: {
    date: string;
    scores: {
      seo: number;
      performance: number;
      accessibility: number;
    };
  };
}
