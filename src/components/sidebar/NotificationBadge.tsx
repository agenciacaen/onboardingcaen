import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationType } from '@/services/notification.service';

interface NotificationBadgeProps {
  type: NotificationType;
}

export function NotificationBadge({ type }: NotificationBadgeProps) {
  const { profile } = useAuthStore();
  const { notifications } = useNotificationStore();

  if (!profile?.client_id) return null;

  // Computa o valor diretamente do estado da store (valor derivado)
  const count = notifications.filter(
    n => n.type === type && !n.read_at
  ).length;

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white animate-in zoom-in duration-300">
      {count > 99 ? '99+' : count}
    </span>
  );
}
