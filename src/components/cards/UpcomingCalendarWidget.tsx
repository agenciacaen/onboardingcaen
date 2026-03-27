import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
};

export function UpcomingCalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const today = new Date();
        const nextWeek = addDays(today, 7);

        const { data, error } = await supabase
          .from('social_calendar_events')
          .select('id, title, event_date, event_type')
          .gte('event_date', format(today, 'yyyy-MM-dd'))
          .lte('event_date', format(nextWeek, 'yyyy-MM-dd'))
          .order('event_date', { ascending: true })
          .limit(5);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        toast.error('Erro ao carregar calendário');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'story': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'live': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Próximos 7 Dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton className="h-[200px] w-full" />
        ) : events.length === 0 ? (
          <div className="text-sm text-center text-muted-foreground p-4">
            Nenhum evento próximo.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{event.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(event.event_type)} capitalize`}>
                  {event.event_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
