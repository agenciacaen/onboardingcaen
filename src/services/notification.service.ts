import { supabase } from './supabase';
import type { Notification } from '../types/general.types';

export type NotificationType = Notification['type'];

export interface CreateNotificationParams {
  userId?: string; 
  clientId: string; 
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}

export const NotificationService = {
  /**
   * Cria uma nova notificação no banco de dados.
   */
  async createNotification({ userId, clientId, type, title, body, link }: CreateNotificationParams) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          client_id: clientId,
          type,
          title,
          body,
          link,
          read_at: null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return { success: false, error };
    }
  },

  /**
   * Marca todas as notificações de um tipo específico como lidas para um cliente.
   */
  async markAsReadByType(clientId: string, type: NotificationType) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('type', type)
        .is('read_at', null);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      return { success: false, error };
    }
  }
};
