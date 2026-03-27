import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { TaskCard } from './TaskCard';
import { toast } from 'sonner';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  module: string;
  clients: { name: string };
  profiles: { full_name: string };
};

const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in_progress', title: 'Em Progresso' },
  { id: 'review', title: 'Revisão' },
  { id: 'done', title: 'Concluído' }
];

export function KanbanBoard({ clientIdFilter }: { clientIdFilter?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!isMounted) return;

      let query = supabase.from('tasks').select(`
        id, title, description, status, priority, due_date, module,
        clients ( name ), profiles ( full_name )
      `).is('deleted_at', null).order('created_at', { ascending: false });

      if (clientIdFilter && clientIdFilter !== 'all') {
        query = query.eq('client_id', clientIdFilter);
      }
      const { data, error } = await query;
      if (error) {
         console.error("Erro listando tarefas", error);
      } else if (isMounted) {
         setTasks((data as unknown as Task[]) || []);
      }
    };

    void fetchTasks();
    return () => { isMounted = false; };
  }, [clientIdFilter]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === draggedTaskId ? { ...t, status: statusId } : t));
    
    // DB Update
    const { error } = await supabase
      .from('tasks')
      .update({ status: statusId })
      .eq('id', draggedTaskId);
      
    if (error) {
      toast.error('Erro ao mover tarefa');
      setTasks(previousTasks); // rollback
    } else {
      toast.success('Tarefa atualizada!');
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex h-full gap-4 items-start w-max min-w-full">
      {columns.map(col => (
        <div 
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className="flex-shrink-0 w-80 bg-slate-100 rounded-lg p-4 flex flex-col max-h-[80vh]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">{col.title}</h3>
            <span className="bg-slate-200 text-slate-600 text-xs py-1 px-2 rounded-full font-medium">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <TaskCard task={task} />
              </div>
            ))}
            {tasks.filter(t => t.status === col.id).length === 0 && (
               <div className="text-center text-sm text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-lg">
                  Arraste tarefas para cá
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
