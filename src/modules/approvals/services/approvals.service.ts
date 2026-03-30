import { supabase } from '@/services/supabase';
import type { SocialApproval, WebDeliveryApproval, ApprovalCounts } from '../types';

export const ApprovalsService = {
  async getPendingApprovals(clientId: string) {
    try {
      // 1. Social Approvals (pending)
      const { data: socialData, error: socialError } = await supabase
        .from('social_approvals')
        .select('*, content:social_contents(*)')
        .eq('client_id', clientId)
        .eq('status', 'pending');

      if (socialError) throw socialError;

      // 2. Web Deliveries (delivered)
      const { data: webData, error: webError } = await supabase
        .from('web_deliveries')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'delivered');

      if (webError) throw webError;

      return {
        social: (socialData || []) as unknown as SocialApproval[],
        web: (webData || []) as unknown as WebDeliveryApproval[],
      };
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error);
      throw error;
    }
  },

  async approveItem(
    itemId: string,
    itemType: 'social_content' | 'web_delivery',
    status: 'approved' | 'rejected', // social usa rejected, web usa solicitação de revisão que pode ser representada por rejected
    comment?: string
  ) {
    try {
      // O Supabase tem uma RPC approve_item mencionada nos requisitos
      const { data, error } = await supabase.rpc('approve_item', {
        p_item_id: itemId,
        p_item_type: itemType,
        p_status: status,
        p_comment: comment || null,
      });

      if (error) {
        // Fallback local se a RPC ainda não existir na base de dados
        console.warn('RPC approve_item falhou, realizando update direto:', error);
        
        if (itemType === 'social_content') {
            const { error: updErr } = await supabase
                .from('social_approvals')
                .update({ status, comment, reviewed_at: new Date().toISOString() })
                // .eq('content_id', itemId) -> The requirement says itemId, could be approval id or content id. Assuming approval ID.
                .eq('id', itemId);
            if (updErr) throw updErr;
        } else if (itemType === 'web_delivery') {
            const webStatus = status === 'approved' ? 'approved' : 'in_progress';
            const { error: updErr } = await supabase
                .from('web_deliveries')
                .update({ status: webStatus }) // A log de comment pra web exigiria tabela extra ou array local, vamos apenas atualizar status.
                .eq('id', itemId);
            if (updErr) throw updErr;
        }

        return { success: true };
      }

      return data;
    } catch (error) {
      console.error('Erro ao aprovar item:', error);
      throw error;
    }
  },
  
  // Usado para o Badge
  async getApprovalCounts(clientId: string): Promise<ApprovalCounts> {
      try {
        const { count: socialCount, error: socialError } = await supabase
          .from('social_approvals')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('status', 'pending');
          
        const { count: webCount, error: webError } = await supabase
          .from('web_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('status', 'delivered');
          
        if (socialError || webError) {
            console.error(socialError, webError);
            return { social: 0, web: 0, total: 0 };
        }
        
        return {
            social: socialCount || 0,
            web: webCount || 0,
            total: (socialCount || 0) + (webCount || 0)
        };
      } catch (error) {
          console.error('Error fetching approval counts:', error);
          return { social: 0, web: 0, total: 0 };
      }
  }
};
