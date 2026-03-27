export interface Content {
  id: string;
  client_id: string;
  title: string;
  caption?: string;
  hashtags?: string[];
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'carousel' | 'reel';
  platform: string[];
  scheduled_at?: string;
  published_at?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'published';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  client_id: string;
  content_id?: string;
  title: string;
  event_date: string;
  event_type: 'post' | 'story' | 'live' | 'meeting';
  platform?: string;
  color?: string;
  created_at: string;
}

export interface Approval {
  id: string;
  client_id: string;
  content_id: string;
  reviewed_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SocialReport {
  id: string;
  client_id: string;
  title: string;
  period_start: string;
  period_end: string;
  file_url?: string;
  summary?: Record<string, unknown>;
  generated_by?: string;
  created_at: string;
}

export interface SocialOverview {
  total_posts: number;
  published: number;
  scheduled: number;
  pending_approvals: number;
  rejected: number;
  platforms: {
    instagram: number;
    facebook: number;
    linkedin: number;
    [key: string]: number;
  };
}
