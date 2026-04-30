import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { supabase } from '@/services/supabase';
import type { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';
import { Database, Cpu, Zap, CheckCircle2, Clock } from 'lucide-react';

interface TaskCounts {
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  total: number;
}

export function ClientCRMPage() {
  const { clientId } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [isLoading, setIsLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
    total: 0
  });

  useEffect(() => {
    if (!clientId) return;

    const fetchTaskStats = async () => {
      setIsLoading(true);
      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('status')
          .eq('client_id', clientId)
          .eq('module', 'crm');

        if (error) throw error;

        const counts = (tasks || []).reduce((acc: TaskCounts, task: { status: string }) => {
          const status = task.status as keyof Omit<TaskCounts, 'total'>;
          if (acc[status] !== undefined) {
            acc[status]++;
          }
          acc.total++;
          return acc;
        }, { todo: 0, in_progress: 0, review: 0, done: 0, total: 0 });
        
        setTaskCounts(counts);
      } catch (err) {
        console.error('Erro ao buscar estatísticas de CRM:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskStats();
  }, [clientId]);

  const completionRate = useMemo(() => {
    if (taskCounts.total === 0) return 0;
    return Math.round((taskCounts.done / taskCounts.total) * 100);
  }, [taskCounts]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="CRM e Tecnologia" 
          description="Acompanhe a implantação de processos, automações e saúde do seu ecossistema digital." 
        />
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">

        <TabsContent value="kanban" className="mt-0 pt-2">
          {clientId && <ClientModuleTasksView module="crm" view="kanban" />}
        </TabsContent>

        <TabsContent value="integrations" className="mt-0 pt-2">
          {clientId && <ClientModuleTasksView module="crm" view="list" />}
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Implantação CRM e IA</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
                <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${completionRate}%` }} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Progresso Geral</p>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Em Andamento</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{taskCounts.in_progress}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Implementação ativa</p>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">CRM Ativo</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{taskCounts.done}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Etapas concluídas</p>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Backlog / Planejado</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{taskCounts.todo}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Próximas melhorias</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm min-h-[350px] flex flex-col">
                <h3 className="font-semibold text-foreground mb-4">Fluxo de Dados e Integrações</h3>
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-card rounded-full shadow-sm mx-auto w-fit border border-border">
                      <Cpu className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">Visualização de fluxo em desenvolvimento</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-foreground">Roadmap de Tecnologia</h2>
                 <span className="text-xs text-muted-foreground">Próximos passos da sua infraestrutura</span>
               </div>
               <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                  <div className="space-y-6">
                    <div className="relative pl-8 border-l-2 border-primary/20 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-card shadow-sm" />
                      <h4 className="text-sm font-bold text-foreground">Integração Omni-channel</h4>
                      <p className="text-xs text-muted-foreground mt-1">Conexão centralizada de todos os canais de atendimento no CRM.</p>
                    </div>
                    <div className="relative pl-8 border-l-2 border-primary/10 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-muted border-4 border-card shadow-sm" />
                      <h4 className="text-sm font-bold text-muted-foreground">Lead Scoring Avançado</h4>
                      <p className="text-xs text-muted-foreground mt-1">Implementação de regras de pontuação automática para qualificação de leads.</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
