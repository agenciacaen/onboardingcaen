import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type Notification = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  type: string;
};

export function TeamActivityFeed() {
  const [activities, setActivities] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        // Exibindo ultimas notificacoes como "feed" da equipe
        const { data, error } = await supabase
          .from('notifications')
          .select('id, title, body, created_at, type')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast.error('Erro ao carregar atividades');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton className="h-[200px] w-full" />
        ) : activities.length === 0 ? (
          <div className="text-sm text-center text-muted-foreground p-4">
            Nenhuma atividade recente.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex gap-4 items-start border-b pb-3 last:border-0 last:pb-0">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  {activity.body && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{activity.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
