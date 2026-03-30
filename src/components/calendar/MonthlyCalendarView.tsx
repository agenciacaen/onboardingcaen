import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventCreateModal } from '@/components/modals/EventCreateModal';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  color: string;
  client_id: string;
};

interface MonthlyCalendarViewProps {
  clientIdFilter?: string;
}

export function MonthlyCalendarView({ clientIdFilter }: MonthlyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const dateStart = format(mStart, 'yyyy-MM-dd');
    const dateEnd = format(mEnd, 'yyyy-MM-dd');

    // Busca eventos sociais
    const socialQuery = supabase
      .from('social_calendar_events')
      .select('*')
      .gte('event_date', dateStart)
      .lte('event_date', dateEnd);

    // Busca tarefas com prazo (apenas atividades pai)
    const tasksQuery = supabase
      .from('tasks')
      .select('*')
      .is('parent_id', null)
      .not('due_date', 'is', null)
      .gte('due_date', dateStart)
      .lte('due_date', dateEnd);

    if (clientIdFilter && clientIdFilter !== 'all') {
      socialQuery.eq('client_id', clientIdFilter);
      tasksQuery.eq('client_id', clientIdFilter);
    }

    const [socialRes, tasksRes] = await Promise.all([socialQuery, tasksQuery]);

    if (socialRes.error) toast.error('Erro ao buscar eventos sociais.');
    if (tasksRes.error) toast.error('Erro ao buscar tarefas.');

    const socialEvents = socialRes.data || [];
    const taskEvents = (tasksRes.data || []).map(task => ({
      id: task.id,
      title: `[T] ${task.title}`, // Adicionando [T] para destacar que é tarefa
      event_date: task.due_date,
      event_type: 'tarefa',
      color: '#6366f1', // Cor Indigo para tarefas
      client_id: task.client_id
    }));

    setEvents([...socialEvents, ...taskEvents]);
    setLoading(false);
  }, [currentDate, clientIdFilter]);


  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (isMounted) fetchEvents();
    };
    void load();
    return () => { isMounted = false; };
  }, [fetchEvents]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setModalOpen(true);
  };

  // Build grid
  const startDate = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
  const endDate = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, 'd');
      const cloneDay = day;
      const dayEvents = events.filter(e => e.event_date === format(cloneDay, 'yyyy-MM-dd'));

      days.push(
        <div
          key={day.toString()}
          onClick={() => handleDayClick(cloneDay)}
          className={`min-h-[100px] p-2 border border-slate-200 transition-colors hover:bg-slate-50 cursor-pointer ${
            !isSameMonth(day, currentDate) ? 'bg-slate-100 text-slate-400' : 'bg-white'
          } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary ring-inset' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold">{formattedDate}</span>
          </div>
          <div className="mt-2 flex flex-col gap-1 space-y-1">
            {dayEvents.map(evt => (
              <div 
                key={evt.id} 
                className="text-xs px-1.5 py-0.5 rounded truncate text-white calendar-event-item"
                style={{ "--event-color": evt.color || '#3b82f6' } as React.CSSProperties}
                title={evt.title}
              >
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-px" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-slate-200 border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
            <div key={dayName} className="p-2 text-center text-sm font-semibold text-slate-600 bg-white">
              {dayName}
            </div>
          ))}
        </div>
        <div className="bg-slate-200 gap-px pb-px">
          {loading ? (
            <LoadingSkeleton className="h-[500px] w-full" />
          ) : (
             <div className="bg-white">
                {rows}
             </div>
          )}
        </div>
      </div>

      <EventCreateModal 
        open={isModalOpen} 
        onOpenChange={setModalOpen}
        initialDate={selectedDate}
        onSuccess={fetchEvents}
      />
    </div>
  );
}
