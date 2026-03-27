import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlayCircle, PauseCircle, AlertCircle, FileEdit, HelpCircle } from 'lucide-react';

interface AdStatusBadgeProps {
  status: 'active' | 'paused' | 'rejected' | 'draft' | string;
  className?: string;
}

export function AdStatusBadge({ status, className }: AdStatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className={cn("bg-green-500/10 text-green-600 border-green-200 gap-1 pr-2", className)}>
          <PlayCircle className="h-3 w-3" /> Ativo
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="outline" className={cn("bg-amber-500/10 text-amber-600 border-amber-200 gap-1 pr-2", className)}>
          <PauseCircle className="h-3 w-3" /> Pausado
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className={cn("bg-red-500/10 text-red-600 border-red-200 gap-1 pr-2", className)}>
          <AlertCircle className="h-3 w-3" /> Reprovado
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className={cn("bg-slate-500/10 text-slate-600 border-slate-200 gap-1 pr-2", className)}>
          <FileEdit className="h-3 w-3" /> Rascunho
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("gap-1 pr-2", className)}>
          <HelpCircle className="h-3 w-3" /> {status}
        </Badge>
      );
  }
}
