import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from '@/types/general.types';

interface ClientProjectRoadmapProps {
  clientId: string;
}

export function ClientProjectRoadmap({ clientId }: ClientProjectRoadmapProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; done: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadRoadmap = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const { data: parentTasks, error: pError } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (pError) throw pError;
      setTasks(parentTasks || []);

      if (parentTasks && parentTasks.length > 0) {
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
    loadRoadmap();
  }, [loadRoadmap]);

  const totalItems = Object.values(stats).reduce((acc, s) => acc + (s.total || 1), 0);
  const doneItems = Object.values(stats).reduce((acc, s) => acc + (s.done || 0), 0) + tasks.filter(t => t.status === 'done' && !stats[t.id]?.total).length;
  
  const globalProgress = totalItems > 0 
    ? Math.round((doneItems / totalItems) * 100) 
    : (tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0);

  if (isLoading) {
    return (
      <Card className="border-slate-100 shadow-sm bg-white">
        <CardContent className="p-6">
           <div className="h-2 w-full bg-slate-100 animate-pulse rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) return null;

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Progresso do Projeto</span>
          <span className="text-primary text-xl font-bold">{globalProgress}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-4">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-indigo-600 relative",
                globalProgress === 100 && "from-emerald-500 to-teal-600"
              )}
              style={{ width: `${globalProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <p>Acompanhe a evolução do seu projeto conosco.</p>
            <button 
              onClick={() => window.location.href = '/client/onboarding'}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              Ver Detalhes do Roteiro <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
