import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date?: string;
    module: string;
    clients?: { name: string } | null;
    profiles?: { full_name: string } | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
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

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </Badge>
        {task.module !== 'general' && (
           <span className="text-[10px] uppercase font-bold text-slate-400">
             {task.module}
           </span>
        )}
      </div>
      
      <h4 className="font-medium text-sm text-slate-800 mb-1 line-clamp-2">
        {task.title}
      </h4>
      
      <p className="text-xs text-slate-500 mb-3 truncate">
        {task.clients?.name || 'Geral'}
      </p>

      <div className="flex items-center justify-between text-slate-400 text-xs">
        <div className="flex items-center space-x-2">
          {task.due_date && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{format(new Date(task.due_date), "dd/MM", { locale: ptBR })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
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
