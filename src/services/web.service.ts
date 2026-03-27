import { supabase } from './supabase';
import type { Page, Audit, Delivery, WebOverview } from '../types/web.types';

export const webService = {
  // RPC Calls
  getWebOverview: async (clientId: string): Promise<WebOverview> => {
    const { data, error } = await supabase.rpc('get_web_overview', {
      p_client_id: clientId,
    });

    if (error) throw error;
    return data as WebOverview;
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
  getPages: async (clientId: string): Promise<Page[]> => {
    const { data, error } = await supabase
      .from('web_pages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Page[];
  },

  getAudits: async (clientId: string, pageId?: string): Promise<Audit[]> => {
    let query = supabase
      .from('web_audits')
      .select('*, web_pages(title, url)')
      .eq('client_id', clientId)
      .order('audit_date', { ascending: false });

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Audit[];
  },

  getAuditDetails: async (auditId: string): Promise<Audit> => {
    const { data, error } = await supabase
      .from('web_audits')
      .select('*, web_pages(title, url)')
      .eq('id', auditId)
      .single();

    if (error) throw error;
    return data as Audit;
  },

  getDeliveries: async (clientId: string): Promise<Delivery[]> => {
    const { data, error } = await supabase
      .from('web_deliveries')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data as Delivery[];
  },

  // Storage
  getSignedUrl: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60); // 1 hour
    if (error) throw error;
    return data.signedUrl;
  }
};
