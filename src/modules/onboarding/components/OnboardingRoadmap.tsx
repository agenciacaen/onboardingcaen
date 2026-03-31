import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Share2,
  Settings2,
  Megaphone,
  Rocket,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import type { Task } from '@/types/general.types';
import { cn } from '@/lib/utils';
import { supabase } from '@/services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingRoadmapProps {
  tasks: Task[];
  onToggleSubtask?: (subtaskId: string, currentStatus: string) => void;
  isToggling?: string | null;
  readOnly?: boolean;
}

const MODULE_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string; label: string }> = {
  social: {
    icon: Share2,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-900/10',
    label: 'Redes Sociais',
  },
  general: {
    icon: Settings2,
    color: 'text-sky-400',
    gradient: 'from-sky-500/20 to-sky-900/10',
    label: 'CMM / CRM',
  },
  traffic: {
    icon: Megaphone,
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-900/10',
    label: 'Tráfego Pago',
  },
  web: {
    icon: Rocket,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
    label: 'Web & SEO',
  },
  onboarding: {
    icon: Rocket,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-900/10',
    label: 'Onboarding',
  },
};

function getPhaseLabel(stage: string) {
  if (stage === 'onboarding_phase_1') return 'Fase 1 — Setup Inicial';
  if (stage === 'onboarding_phase_2') return 'Fase 2 — Escalabilidade';
  if (stage === 'unknown') return 'Atividades Complementares';
  return stage;
}

export function OnboardingRoadmap({ tasks, onToggleSubtask, isToggling, readOnly = false }: OnboardingRoadmapProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; content: string; created_at: string; author: string }[]>>({});

  // Buscar comentários de todas as tarefas pai
  useEffect(() => {
    const parentIds = tasks.filter(t => !t.parent_id).map(t => t.id);
    if (parentIds.length === 0) return;

    const loadComments = async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, content, created_at, task_id, author:profiles!task_comments_author_id_fkey(full_name)')
        .in('task_id', parentIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const map: Record<string, { id: string; content: string; created_at: string; author: string }[]> = {};
        for (const c of data as Record<string, unknown>[]) {
          const taskId = c.task_id as string;
          if (!map[taskId]) map[taskId] = [];
          map[taskId].push({
            id: c.id as string,
            content: c.content as string,
            created_at: c.created_at as string,
            author: (c.author as { full_name: string } | null)?.full_name || 'Equipe',
          });
        }
        setCommentsMap(map);
      }
    };
    loadComments();
  }, [tasks]);

  // Separar tarefas pai (sem parent_id) e subtarefas
  const parentTasks = tasks.filter(t => !t.parent_id);
  const subtasksMap = new Map<string, Task[]>();
  tasks.filter(t => t.parent_id).forEach(t => {
    const existing = subtasksMap.get(t.parent_id!) || [];
    existing.push(t);
    subtasksMap.set(t.parent_id!, existing);
  });

  // Agrupar por stage
  const stages = [...new Set(parentTasks.map(t => t.stage || 'unknown'))];

  const toggleExpand = (taskId: string) => {
    setExpanded(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Calcular progresso global (considera subtarefas + tarefas pai que não possuem subtarefas)
  const allSubtasks = tasks.filter(t => t.parent_id);
  const completedSubtasks = allSubtasks.filter(t => t.status === 'done');
  
  const parentsWithNoSubs = parentTasks.filter(pt => !subtasksMap.has(pt.id));
  const completedParentsWithNoSubs = parentsWithNoSubs.filter(pt => pt.status === 'done');

  const totalItems = allSubtasks.length + parentsWithNoSubs.length;
  const completedItems = completedSubtasks.length + completedParentsWithNoSubs.length;

  const globalProgress = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Barra de progresso global */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
            Progresso Geral
          </h3>
          <span className="text-2xl font-bold text-slate-800">{globalProgress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${globalProgress}%`,
              background: globalProgress === 100
                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {completedItems} de {totalItems} entregáveis concluídos
        </p>
      </div>

      {/* Fases */}
      {stages.map(stage => {
        const phaseTasks = parentTasks.filter(t => (t.stage || 'unknown') === stage);

        return (
          <div key={stage} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                {getPhaseLabel(stage)}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
            </div>

            <div className="grid gap-4">
              {phaseTasks.map(parentTask => {
                const subs = subtasksMap.get(parentTask.id) || [];
                const completedSubs = subs.filter(s => s.status === 'done').length;
                const totalSubs = subs.length;
                const phaseProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
                const isExpanded = expanded[parentTask.id] ?? true;
                const config = MODULE_CONFIG[parentTask.module || 'general'] || MODULE_CONFIG.general;
                const Icon = config.icon;

                return (
                  <div
                    key={parentTask.id}
                    className={cn(
                      'rounded-2xl border transition-all duration-300 overflow-hidden',
                      phaseProgress === 100
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white shadow-sm'
                    )}
                  >
                    {/* Header do card */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(parentTask.id)}
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0',
                        config.gradient
                      )}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>
                            {config.label}
                          </span>
                        </div>
                        <h3 className="text-slate-800 font-semibold text-base truncate">
                          {parentTask.title}
                        </h3>
                        {parentTask.description && (
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{parentTask.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-medium text-slate-500">
                            {completedSubs}/{totalSubs}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${phaseProgress}%`,
                                background: phaseProgress === 100
                                  ? '#22c55e'
                                  : config.color.includes('purple') ? '#a855f7'
                                  : config.color.includes('sky') ? '#38bdf8'
                                  : config.color.includes('amber') ? '#f59e0b'
                                  : '#3b82f6',
                              }}
                            />
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Subtarefas */}
                    {isExpanded && subs.length > 0 && (
                      <div className="border-t border-slate-100 px-5 py-3 space-y-1">
                        {subs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(sub => {
                          const isDone = sub.status === 'done';
                          const isTogglingThis = isToggling === sub.id;

                          return (
                            <div
                              key={sub.id}
                              className={cn(
                                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all group',
                                isDone ? 'opacity-60' : 'hover:bg-slate-50',
                                !readOnly && !isDone && 'cursor-pointer'
                              )}
                              onClick={() => {
                                if (!readOnly && onToggleSubtask && !isTogglingThis) {
                                  onToggleSubtask(sub.id, sub.status);
                                }
                              }}
                            >
                              {isTogglingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                              )}
                              <span className={cn(
                                'text-sm flex-1',
                                isDone ? 'text-slate-400 line-through' : 'text-slate-700'
                              )}>
                                {sub.title}
                              </span>
                              {sub.description && !isDone && (
                                <span className="text-[10px] text-slate-400 hidden sm:block max-w-[200px] truncate">
                                  {sub.description}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Comentários/Notas da equipe */}
                    {isExpanded && (commentsMap[parentTask.id] || []).length > 0 && (
                      <div className="border-t border-slate-100 px-5 py-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">Notas da Equipe</span>
                        </div>
                        <div className="space-y-2">
                          {(commentsMap[parentTask.id] || []).map(comment => (
                            <div key={comment.id} className="bg-blue-50/60 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-semibold text-blue-600">{comment.author}</span>
                                <span className="text-[10px] text-blue-400">
                                  {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
