export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok' | 'linkedin';
  objective?: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  budget_total?: number;
  budget_daily?: number;
  start_date?: string;
  end_date?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  campaign_id: string;
  client_id: string;
  name: string;
  format?: 'image' | 'video' | 'carousel' | 'story';
  creative_url?: string;
  headline?: string;
  copy?: string;
  cta?: string;
  destination_url?: string;
  status: 'active' | 'paused' | 'rejected' | 'draft';
  external_id?: string;
  is_best: boolean;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  client_id: string;
  campaign_id?: string;
  ad_id?: string;
  date: string;
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  reach?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  created_at: string;
}

export interface TrafficReport {
  id: string;
  client_id: string;
  title: string;
  period_start: string;
  period_end: string;
  file_url?: string;
  summary?: any;
  generated_by?: string;
  created_at: string;
}
