
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, PauseCircle, CheckCircle2, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CampaignStatusData {
  active: number;
  paused: number;
  ended: number;
  draft: number;
}

interface CampaignStatusSummaryProps {
  data: CampaignStatusData;
  activeFilter?: string | null;
  onFilterChange?: (status: string | null) => void;
}

export function CampaignStatusSummary({ data, activeFilter, onFilterChange }: CampaignStatusSummaryProps) {
  const statuses = [
    { id: 'active', label: 'Ativas', count: data.active, icon: <PlayCircle className="h-5 w-5 text-green-500" />, bg: "bg-green-500/10 text-green-600 dark:text-green-500" },
    { id: 'paused', label: 'Pausadas', count: data.paused, icon: <PauseCircle className="h-5 w-5 text-amber-500" />, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-500" },
    { id: 'ended', label: 'Encerradas', count: data.ended, icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />, bg: "bg-blue-500/10 text-blue-600 dark:text-blue-500" },
    { id: 'draft', label: 'Rascunhos', count: data.draft, icon: <FileEdit className="h-5 w-5 text-slate-500" />, bg: "bg-slate-500/10 text-slate-600 dark:text-slate-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statuses.map((status) => (
        <Card 
          key={status.id} 
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors", 
            activeFilter === status.id && "ring-2 ring-primary bg-muted/30"
          )}
          onClick={() => onFilterChange?.(activeFilter === status.id ? null : status.id)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
              <p className="text-2xl font-bold">{status.count}</p>
            </div>
            <div className={cn("p-2 rounded-full", status.bg)}>
              {status.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
