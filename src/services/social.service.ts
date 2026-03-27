import { supabase } from './supabase';
import type { Content, CalendarEvent, Approval, SocialReport, SocialOverview } from '../types/social.types';

export const socialService = {
  // RPC Calls
  getSocialOverview: async (clientId: string, startDate?: string, endDate?: string): Promise<SocialOverview> => {
    // Default to last 30 days if not provided, you can map this later from DatePicker
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('get_social_overview', {
      p_client_id: clientId,
      p_start: start,
      p_end: end,
    });

    if (error) throw error;
    return data as SocialOverview;
  },

  approveItem: async (itemId: string, itemType: 'social_content' | 'web_delivery', status: 'approved' | 'rejected', comment?: string) => {
    const { data, error } = await supabase.rpc('approve_item', {
      p_item_id: itemId,
      p_item_type: itemType,
      p_status: status,
      p_comment: comment || '',
    });

    if (error) throw error;
    return data;
  },

  // Queries
  getContents: async (clientId: string): Promise<Content[]> => {
    const { data, error } = await supabase
      .from('social_contents')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data as Content[];
  },

  getCalendarEvents: async (clientId: string, month: string): Promise<CalendarEvent[]> => {
    // Expected month in YYYY-MM format
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Approx, date-fns could handle better but this filters appropriately for postgress dates starting with month

    const { data, error } = await supabase
      .from('social_calendar_events')
      .select('*')
      .eq('client_id', clientId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data as CalendarEvent[];
  },

  getPendingApprovals: async (clientId: string): Promise<Approval[]> => {
    const { data, error } = await supabase
      .from('social_approvals')
      .select('*, social_contents(*)')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Approval[];
  },

  getApprovalHistory: async (clientId: string): Promise<Approval[]> => {
     const { data, error } = await supabase
      .from('social_approvals')
      .select('*, social_contents(*), profiles(full_name)')
      .eq('client_id', clientId)
      .neq('status', 'pending')
      .order('reviewed_at', { ascending: false });

    if (error) throw error;
    return data as Approval[];
  },

  getReports: async (clientId: string): Promise<SocialReport[]> => {
    const { data, error } = await supabase
      .from('social_reports')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SocialReport[];
  },

  // Storage
  getSignedUrl: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60); // 1 hour
    if (error) throw error;
    return data.signedUrl;
  },

  // Realtime subscription
  subscribeToApprovals: (clientId: string, callback: (payload: Record<string, unknown>) => void) => {
    return supabase
      .channel('social_approvals_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'social_approvals',
          filter: `client_id=eq.${clientId}` // Requires RLS to let users filter or proper setup for Realtime
        },
        callback
      )
      .subscribe();
  }
};
