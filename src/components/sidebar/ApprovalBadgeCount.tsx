import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ApprovalsService } from '@/modules/approvals/services/approvals.service';

export function ApprovalBadgeCount() {
  const { clientId } = useAuthStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!clientId) return;

    // Load initial count
    const loadCount = async () => {
      const counts = await ApprovalsService.getApprovalCounts(clientId);
      setCount(counts.total);
    };

    loadCount();

    // Subscribe to changes in social_approvals
    const socialSubscription = supabase
      .channel('social_approvals_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'social_approvals',
        filter: `client_id=eq.${clientId}`
      }, () => {
        loadCount();
      })
      .subscribe();

    // Subscribe to changes in web_deliveries
    const webSubscription = supabase
      .channel('web_deliveries_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'web_deliveries',
        filter: `client_id=eq.${clientId}`
      }, () => {
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(socialSubscription);
      supabase.removeChannel(webSubscription);
    };
  }, [clientId]);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
