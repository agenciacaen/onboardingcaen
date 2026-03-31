import { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/general.types';

interface ClientProjectRoadmapProps {
  clientId: string;
}

const MODULE_COLORS: Record<string, string> = {
  social: 'text-purple-500 bg-purple-50 border-purple-100',
  traffic: 'text-amber-500 bg-amber-50 border-amber-100',
  web: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  general: 'text-blue-500 bg-blue-50 border-blue-100',
  crm: 'text-indigo-500 bg-indigo-50 border-indigo-100',
};

const MODULE_LABELS: Record<string, string> = {
  social: 'Social Media',
  traffic: 'Tráfego Pago',
  web: 'Web',
  general: 'Geral',
  crm: 'CRM',
};

export function ClientProjectRoadmap({ clientId }: ClientProjectRoadmapProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; done: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadRoadmap = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Busca todas as tarefas pai do cliente
      const { data: parentTasks, error: pError } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (pError) throw pError;
      setTasks(parentTasks || []);

      if (parentTasks && parentTasks.length > 0) {
        // 2. Busca contagem de subtarefas para cada tarefa pai
        const parentIds = parentTasks.map(t => t.id);
        const { data: subtasks, error: sError } = await supabase
          .from('tasks')
          .select('id, parent_id, status')
          .in('parent_id', parentIds);

        if (sError) throw sError;

        const subStats: Record<string, { total: number; done: number }> = {};
        parentIds.forEach(id => subStats[id] = { total: 0, done: 0 });
        
        subtasks?.forEach(sub => {
          if (sub.parent_id) {
            subStats[sub.parent_id].total++;
            if (sub.status === 'done') subStats[sub.parent_id].done++;
          }
        });
        setStats(subStats);
      }
    } catch (error) {
      console.error('Erro ao carregar roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) loadRoadmap();
  }, [clientId, loadRoadmap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700">Nenhuma etapa definida</h3>
        <p className="text-xs text-slate-500 mt-1">Sua jornada estratégica aparecerá aqui em breve.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Acompanhamento do Projeto</h2>
          <p className="text-xs text-slate-500">Principais entregas e metas da sua conta.</p>
        </div>
        <div className="flex -space-x-2">
           {/* Visual purely decorative */}
           <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">C</div>
           <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">A</div>
        </div>
      </div>

      <div className="p-2">
        <div className="space-y-1">
          {tasks.map((task) => {
            const taskStats = stats[task.id] || { total: 0, done: 0 };
            const hasSubtasks = taskStats.total > 0;
            const progress = hasSubtasks ? Math.round((taskStats.done / taskStats.total) * 100) : (task.status === 'done' ? 100 : 0);
            const isDone = task.status === 'done' || progress === 100;
            const moduleColor = MODULE_COLORS[task.module || 'general'] || MODULE_COLORS.general;

            return (
              <div 
                key={task.id}
                className={cn(
                  "group relative p-4 rounded-xl transition-all duration-200",
                  "hover:bg-slate-50 border border-transparent hover:border-slate-100",
                  isDone && "opacity-75"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border", moduleColor)}>
                        {MODULE_LABELS[task.module || 'general'] || 'Geral'}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={cn(
                      "text-sm font-semibold truncate transition-colors",
                      isDone ? "text-slate-400 line-through" : "text-slate-800"
                    )}>
                      {task.title}
                    </h3>
                    
                    {hasSubtasks ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          <span>Progresso da Etapa</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isDone ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {taskStats.done} de {taskStats.total} sub-atividades concluídas
                        </p>
                      </div>
                    ) : task.description ? (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                    ) : null}
                  </div>

                  <button 
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white border border-transparent hover:border-slate-200 shadow-sm"
                    title="Ver detalhes"
                    aria-label="Ver detalhes"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
        <button 
          onClick={() => window.location.href = '/client/onboarding'}
          className="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline"
        >
          Ver Roteiro Completo de Ativação
        </button>
      </div>
    </div>
  );
}
