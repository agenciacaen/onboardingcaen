export interface SocialApproval {
  id: string; // id de social_approvals
  client_id: string;
  content_id: string;
  reviewed_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Join
  content?: {
    id: string;
    title: string;
    caption: string | null;
    media_urls: string[] | null;
    media_type: string | null;
    platform: string[];
    scheduled_at: string | null;
  };
}

export interface WebDeliveryApproval {
  id: string; // id de web_deliveries
  client_id: string;
  title: string;
  description: string | null;
  delivery_type: string | null;
  status: 'planned' | 'in_progress' | 'delivered' | 'approved';
  delivered_at: string | null;
  due_date: string | null;
  file_urls: string[] | null;
  created_at: string;
}

export interface ApprovalCounts {
  social: number;
  web: number;
  total: number;
}
