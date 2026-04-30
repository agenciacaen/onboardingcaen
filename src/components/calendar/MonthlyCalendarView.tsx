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
import { ChevronLeft, ChevronRight, Flag, Camera, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventCreateModal, type CalendarEventItem } from '@/components/modals/EventCreateModal';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface MonthlyCalendarViewProps {
  clientIdFilter?: string;
}

export function MonthlyCalendarView({ clientIdFilter }: MonthlyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

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

    const socialEvents = (socialRes.data || []).map(e => ({
       ...e,
       title: e.title,
    }));

    const taskEvents = (tasksRes.data || []).map(task => ({
      id: task.id,
      title: `[T] ${task.title}`,
      event_date: task.due_date,
      event_type: 'tarefa',
      color: '#6366f1',
      client_id: task.client_id,
      module: task.module,
      description: task.description
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
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEventItem) => {
    e.stopPropagation();
    setSelectedEvent(event);
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
          className={`min-h-[120px] p-2 border border-border transition-all hover:bg-accent/50 cursor-pointer group flex flex-col ${
            !isSameMonth(day, currentDate) ? 'bg-muted/30 text-muted-foreground/50' : 'bg-background'
          } ${isSameDay(day, new Date()) ? 'bg-primary/10 border-primary/30' : ''}`}
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
              isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground group-hover:text-primary'
            }`}>
              {formattedDate}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-0.5">
            {dayEvents.map(evt => {
              const Icon = evt.event_type === 'tarefa' ? Flag : (evt.platform === 'insta' ? Camera : CalendarIcon);
              const color = evt.color || '#3b82f6';
              
              return (
                <div 
                  key={evt.id} 
                  onClick={(e) => handleEventClick(e, evt)}
                  className="group/card relative flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-transparent hover:border-border bg-card shadow-sm hover:shadow-md transition-all calendar-card-item overflow-hidden"
                  title={`${evt.title}${evt.module ? ` • ${evt.module.toUpperCase()}` : ''}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                  <Icon className="w-3 h-3 shrink-0" style={{ color: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-foreground truncate leading-tight">
                      {evt.title.replace('[T] ', '')}
                    </div>
                  </div>
                </div>
              );
            })}
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

      <div className="bg-border border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-muted">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
            <div key={dayName} className="p-2 text-center text-sm font-semibold text-muted-foreground bg-background">
              {dayName}
            </div>
          ))}
        </div>
        <div className="bg-border gap-px pb-px">
          {loading ? (
            <LoadingSkeleton className="h-[500px] w-full" />
          ) : (
             <div className="bg-background">
                {rows}
             </div>
          )}
        </div>
      </div>

      <EventCreateModal 
        open={isModalOpen} 
        onOpenChange={setModalOpen}
        initialDate={selectedDate}
        initialEvent={selectedEvent}
        onSuccess={fetchEvents}
      />
    </div>
  );
}
