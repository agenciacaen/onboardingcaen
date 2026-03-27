import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TaskPreview = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
};

export function TasksBoardPreview() {
  const [tasks, setTasks] = useState<TaskPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, status, priority, due_date')
          .neq('status', 'done')
          .order('priority', { ascending: false })
          .order('due_date', { ascending: true })
          .limit(5);

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks preview:', error);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const truncate = (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Tarefas Urgentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton className="h-[200px] w-full" />
        ) : tasks.length === 0 ? (
          <div className="text-sm text-center text-muted-foreground p-4">
            Nenhuma tarefa pendente. Excelente! 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{truncate(task.title, 35)}</span>
                  <span className={`text-xs ${getPriorityColor(task.priority)} capitalize`}>
                    {task.priority}
                  </span>
                </div>
                {task.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(task.due_date), "dd/MMM", { locale: ptBR })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
