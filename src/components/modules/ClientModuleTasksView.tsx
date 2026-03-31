import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TaskDetailModal, type TaskData, type SubtaskData } from '@/components/modals/TaskDetailModal';
import { Loader2, ListChecks, Calendar, MessageSquare, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientModuleTasksViewProps {
  module: 'traffic' | 'social' | 'web' | 'crm' | 'onboarding';
  view: 'kanban' | 'list';
}

const COLUMNS = [
  { id: 'todo', title: 'Pendente', bg: 'bg-slate-100', text: 'text-slate-700' },
  { id: 'in_progress', title: 'Em Andamento', bg: 'bg-blue-100', text: 'text-blue-700' },
  { id: 'review', title: 'Em Aprovação/Revisão', bg: 'bg-amber-100', text: 'text-amber-700' },
  { id: 'done', title: 'Concluído', bg: 'bg-emerald-100', text: 'text-emerald-700' },
];

export function ClientModuleTasksView({ module, view }: ClientModuleTasksViewProps) {
  const { clientId, profile, role } = useAuth();
  
  // Apenas administradores da agência podem gerenciar tarefas no portal
  const canManage = role === 'admin' || profile?.role === 'admin';

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [subtasksMap, setSubtasksMap] = useState<Map<string, SubtaskData[]>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!clientId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('tasks')
          .select(`
            id, title, description, status, priority, due_date, module, client_id, stage, parent_id,
            profiles!tasks_assigned_to_fkey(full_name)
          `)
          .eq('client_id', clientId);

        if (module === 'onboarding') {
          query = query.or(`stage.in.(onboarding_phase_1,onboarding_phase_2),module.in.(onboarding,general)`);
        } else {
          query = query.eq('module', module);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted && data) {
          const all = data as unknown as TaskData[];
          const parents = all.filter(t => !t.parent_id);
          const subs = all.filter(t => t.parent_id);
          
          const map = new Map<string, SubtaskData[]>();
          subs.forEach((s) => {
             const list = map.get(s.parent_id!) || [];
             list.push(s as unknown as SubtaskData);
             map.set(s.parent_id!, list);
          });
          
          setTasks(parents);
          setSubtasksMap(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [clientId, module]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Carregando atividades {module === 'onboarding' ? 'do onboarding' : `de ${module}`}...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
        <ListChecks className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Nenhuma tarefa ativa neste módulo ainda.</p>
      </div>
    );
  }

  const renderCard = (task: TaskData) => {
    const subs = subtasksMap.get(task.id) || [];
    const completedSubs = subs.filter(s => s.status === 'done').length;
    const progressPct = subs.length > 0 ? Math.round((completedSubs / subs.length) * 100) : 0;

    return (
      <div 
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all text-left"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
            {task.priority}
          </span>
        </div>
        
        <h4 className="font-semibold text-sm text-slate-800 mb-2 line-clamp-2">{task.title}</h4>
        
        {subs.length > 0 && (
          <div className="mb-3">
             <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
               <span>Progresso</span>
               <span>{completedSubs}/{subs.length} ({progressPct}%)</span>
             </div>
             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
             </div>
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{task.due_date ? format(new Date(task.due_date), 'dd/MM', { locale: ptBR }) : 'S/ Prazo'}</span>
          </div>
          <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {view === 'kanban' ? (
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-[300px] shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.bg.replace('-100', '-400')}`} />
                      <h3 className="font-semibold text-slate-700 text-sm">{col.title}</h3>
                      {!canManage && (
                        <div title="Apenas visualização">
                          <Shield className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>
                  <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                
                <div className="flex-1 min-h-[500px] bg-slate-50/50 rounded-xl border border-slate-100 p-2 space-y-3">
                  {colTasks.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progresso</th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!canManage && (
                      <div title="Apenas visualização">
                        <Shield className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                    <span>Prazo</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(t => {
                const subs = subtasksMap.get(t.id) || [];
                const completedSubs = subs.filter(s => s.status === 'done').length;
                const progressPct = subs.length > 0 ? Math.round((completedSubs / subs.length) * 100) : 0;
                const col = COLUMNS.find(c => c.id === t.status) || COLUMNS[0];
                
                return (
                  <tr 
                    key={t.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(t)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{t.title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${col.bg} ${col.text}`}>
                        {col.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-8">{progressPct}%</span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(v) => !v && setSelectedTask(null)}
          task={selectedTask}
          subtasks={subtasksMap.get(selectedTask.id) as unknown as SubtaskData[]}
          readOnly={!canManage}
        />
      )}
    </div>
  );
}
