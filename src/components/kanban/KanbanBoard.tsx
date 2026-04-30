import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { toast } from 'sonner';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  module: string;
  client_id?: string;
  stage?: string;
  parent_id?: string | null;
  clients: { name: string };
  profiles: { full_name: string };
};

const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in_progress', title: 'Em Progresso' },
  { id: 'review', title: 'Revisão' },
  { id: 'done', title: 'Concluído' }
];

export function KanbanBoard({ 
  clientIdFilter, 
  moduleFilter 
}: { 
  clientIdFilter?: string;
  moduleFilter?: string;
}) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select(`
      id, title, description, status, priority, due_date, module, client_id, stage, parent_id,
      clients!tasks_client_id_fkey ( name ), profiles!tasks_assigned_to_fkey ( full_name )
    `).order('created_at', { ascending: false });

    if (clientIdFilter && clientIdFilter !== 'all') {
      query = query.eq('client_id', clientIdFilter);
    }

    if (moduleFilter) {
      // Buscamos o módulo específico OU qualquer item que seja subtarefa (parent_id não nulo).
      query = query.or(`module.eq.${moduleFilter},parent_id.not.is.null`);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Erro listando tarefas", error);
    } else {
      setAllTasks((data as unknown as Task[]) || []);
    }
  }, [clientIdFilter, moduleFilter]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!isMounted) return;
      await fetchTasks();
    };
    void load();
    return () => { isMounted = false; };
  }, [fetchTasks]);

  // Tarefas Pai (inclui tasks sem parent_id — tanto onboarding quanto tarefas avulsas)
  // Pais de onboarding + tarefas normais/avulsas (sem parent_id)
  const parentTasks = allTasks.filter(t => !t.parent_id);

  // Map de subtarefas por parent_id
  const subtasksMap = new Map<string, Task[]>();
  allTasks.filter(t => t.parent_id).forEach(t => {
    const existing = subtasksMap.get(t.parent_id!) || [];
    existing.push(t);
    subtasksMap.set(t.parent_id!, existing);
  });

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

    const movedTask = parentTasks.find(t => t.id === draggedTaskId);
    if (!movedTask) { setDraggedTaskId(null); return; }

    // Optimistic UI update do pai
    const previousAll = [...allTasks];
    // Atualizamos o status localmente
    setAllTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: statusId } : t));

    // DB Update do pai
    const updatePayload: Record<string, unknown> = { status: statusId, updated_at: new Date().toISOString() };
    if (statusId === 'done') {
      updatePayload.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', draggedTaskId);

    if (error) {
      toast.error('Erro ao mover tarefa');
      setAllTasks(previousAll);
      setDraggedTaskId(null);
      return;
    }

    toast.success(statusId === 'done' ? 'Tarefa concluída! Veja no Histórico.' : 'Tarefa atualizada!');

    // Se arrastou para "Concluído" e tem subtarefas, marcar todas como done
    if (statusId === 'done') {
      const subs = subtasksMap.get(draggedTaskId) || [];
      const pendingSubs = subs.filter(s => s.status !== 'done');

      if (pendingSubs.length > 0) {
        const pendingIds = pendingSubs.map(s => s.id);
        const { error: subsError } = await supabase
          .from('tasks')
          .update({
            status: 'done',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', pendingIds);

        if (subsError) {
          console.error('Erro ao completar subtarefas:', subsError);
        } else {
          // Optimistic update das subtarefas
          setAllTasks(prev => prev.map(t =>
            pendingIds.includes(t.id) ? { ...t, status: 'done' } : t
          ));
          toast.success(`${pendingSubs.length} subtarefa(s) concluída(s) automaticamente!`);
        }
      }

      // Verificar se o onboarding do cliente foi completado
      if (movedTask.client_id && movedTask.stage?.startsWith('onboarding_phase_')) {
        await checkOnboardingCompletion(movedTask.client_id);
      }
    }

    setDraggedTaskId(null);
  };

  const checkOnboardingCompletion = async (clientId: string) => {
    try {
      const { data: clientSubs } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('client_id', clientId)
        .in('stage', ['onboarding_phase_1', 'onboarding_phase_2'])
        .not('parent_id', 'is', null);

      if (clientSubs && clientSubs.length > 0) {
        const allDone = clientSubs.every(t => t.status === 'done');
        if (allDone) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('onboarding_completed')
            .eq('id', clientId)
            .single();

          if (clientData && !clientData.onboarding_completed) {
            await supabase
              .from('clients')
              .update({ onboarding_completed: true, status: 'active' })
              .eq('id', clientId);
            toast.success('🎉 Onboarding do cliente concluído!');
          }
        }
      }
    } catch (err) {
      console.error('Erro sincronizando onboarding:', err);
    }
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSubtaskToggleFromModal = (subtaskId: string, newStatus: string) => {
    // Optimistic update no allTasks
    setAllTasks(prev => prev.map(t =>
      t.id === subtaskId ? { ...t, status: newStatus } : t
    ));
  };

  const handleTaskUpdatedFromModal = async () => {
    // Re-fetch para garantir sincronismo após ação no modal
    await fetchTasks();

    // Se a tarefa selecionada tem client_id e é de onboarding, checar conclusão
    if (selectedTask?.client_id && selectedTask.stage?.startsWith('onboarding_phase_')) {
      await checkOnboardingCompletion(selectedTask.client_id);
    }
  };

  // Pega as subtarefas do task selecionado para o modal
  const selectedSubtasks = selectedTask
    ? (subtasksMap.get(selectedTask.id) || []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
      }))
    : [];

  return (
    <>
      <div className="flex h-full gap-4 items-start w-max min-w-full">
        {columns.map(col => (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex-shrink-0 w-80 bg-muted/50 border border-border/50 rounded-lg p-4 flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">{col.title}</h3>
              <span className="bg-muted text-muted-foreground text-xs py-1 px-2 rounded-full font-medium">
                {parentTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
              {parentTasks.filter(t => t.status === col.id).map(task => {
                const subs = subtasksMap.get(task.id) || [];
                const completedSubs = subs.filter(s => s.status === 'done').length;
                
                return (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleCardClick(task)}
                    className="cursor-pointer"
                  >
                    <TaskCard
                      task={task}
                      subtaskCount={subs.length}
                      subtaskCompleted={completedSubs}
                    />
                  </div>
                );
              })}
              {parentTasks.filter(t => t.status === col.id).length === 0 && (
                 <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed border-border rounded-lg">
                    Arraste tarefas para cá
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        onOpenChange={setModalOpen}
        subtasks={selectedSubtasks}
        onSubtaskToggle={handleSubtaskToggleFromModal}
        onTaskUpdated={handleTaskUpdatedFromModal}
      />
    </>
  );
}
