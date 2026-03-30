import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Clock, ListChecks, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date?: string;
    module: string;
    stage?: string;
    clients?: { name: string } | null;
    profiles?: { full_name: string } | null;
  };
  subtaskCount?: number;
  subtaskCompleted?: number;
}

const MODULE_LABELS: Record<string, string> = {
  social: 'Social',
  general: 'Geral',
  traffic: 'Tráfego',
  web: 'Web',
};

const MODULE_COLORS: Record<string, string> = {
  social: 'text-pink-600 bg-pink-100',
  traffic: 'text-indigo-600 bg-indigo-100',
  web: 'text-emerald-600 bg-emerald-100',
  general: 'text-slate-600 bg-slate-100',
};

export function TaskCard({ task, subtaskCount = 0, subtaskCompleted = 0 }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'high': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-400 hover:bg-yellow-500 text-white';
      default: return 'bg-slate-200 hover:bg-slate-300 text-slate-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
     switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  }

  const progressPct = subtaskCount > 0 ? Math.round((subtaskCompleted / subtaskCount) * 100) : 0;
  const isOnboarding = task.stage?.startsWith('onboarding_phase_');

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </Badge>
        <div className="flex items-center gap-1.5">
          {isOnboarding && (
            <span className="text-[9px] uppercase font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">
              Onboarding
            </span>
          )}
          {task.module && task.module !== 'general' && (
            <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded", MODULE_COLORS[task.module] || MODULE_COLORS.general)}>
              {MODULE_LABELS[task.module] || task.module}
            </span>
          )}
        </div>
      </div>
      
      {/* Title */}
      <h4 className="font-medium text-sm text-slate-800 mb-1 line-clamp-2">
        {task.title}
      </h4>
      
      {/* Client */}
      <p className="text-xs text-slate-500 mb-2 truncate">
        {task.clients?.name || 'Geral'}
      </p>

      {/* Subtask progress bar */}
      {subtaskCount > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-slate-500">
              <ListChecks className="w-3 h-3" />
              <span className="text-[10px] font-medium">
                {subtaskCompleted}/{subtaskCount}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? 'linear-gradient(90deg, #22c55e, #10b981)'
                  : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-slate-400 text-xs pt-1">
        <div className="flex items-center space-x-2">
          {task.due_date && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{format(new Date(task.due_date), "dd/MM", { locale: ptBR })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3 h-3 text-slate-300" />
           {task.profiles?.full_name ? (
              <div 
                className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]"
                title={task.profiles.full_name}
              >
                {task.profiles.full_name.charAt(0)}
              </div>
           ) : (
             <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                ?
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
