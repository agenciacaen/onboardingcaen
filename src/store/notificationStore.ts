import { create } from 'zustand';
import type { Notification } from '../types/general.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read_at).length
  }),
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n => 
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    );
    return {
      notifications: updated,
      unreadCount: updated.filter(n => !n.read_at).length
    };
  }),
  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map(n => ({
      ...n,
      read_at: n.read_at || new Date().toISOString()
    }));
    return {
      notifications: updated,
      unreadCount: 0
    };
  })
}));
