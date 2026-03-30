import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export function ApprovalBadgeCount() {
  const { profile } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profile?.client_id) return;

    // Filtra notificações não lidas do tipo 'approval'
    const unreadApprovals = notifications.filter(
      n => n.type === 'approval' && !n.read_at
    ).length;

    if (count !== unreadApprovals) {
      setCount(unreadApprovals);
    }
  }, [notifications, profile?.client_id, count]);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white animate-in zoom-in duration-300">
      {count > 99 ? '99+' : count}
    </span>
  );
}
