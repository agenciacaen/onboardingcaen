import { supabase } from '@/services/supabase';
import type { SupportTicket } from '../types';

export const SupportService = {
  async getTickets(clientId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
  },

  async getTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data as SupportTicket;
  },

  async createTicket(clientId: string, subject: string, description: string, priority: 'low' | 'medium' | 'high') {
    // 1. Cria o ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        client_id: clientId,
        subject,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 2. Insere a primeira mensagem
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
        await supabase
          .from('support_messages')
          .insert({
            client_id: clientId,
            ticket_id: ticket.id,
            sender_id: user.user.id,
            message: description,
          });
    }

    return ticket as SupportTicket;
  },

  async getMessages(ticketId: string) {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        sender_profile:profiles!sender_id (
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(clientId: string, ticketId: string, message: string, attachmentUrl?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        client_id: clientId,
        ticket_id: ticketId,
        sender_id: user.user.id,
        message,
        attachment_url: attachmentUrl || null,
      })
      .select(`
        *,
        sender_profile:profiles!sender_id (
          full_name,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) throw error;

    // O trigger banco de dados pode atualizar a tabela ticket updated_at
    return data;
  },

  async markMessagesAsRead(ticketId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Atualiza apenas as mensagens cujo sender não é o atual user (para cliente, lê das agencias)
    const { error } = await supabase
      .from('support_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)
      .is('read_at', null)
      .neq('sender_id', user.user.id);

    if (error) console.error('Erro ao marcar como lido:', error);
  }
};
