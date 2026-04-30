import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import type { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { socialService } from '@/services/social.service';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';

export function ClientSocialPage() {
  const { clientId } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'calendar';
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !dateRange?.from || !dateRange?.to) return;
      
      try {
        setIsLoading(true);
        const overview = await socialService.getSocialOverview(
          clientId, 
          format(dateRange.from, 'yyyy-MM-dd'),
          format(dateRange.to, 'yyyy-MM-dd')
        );
        setData(overview);
      } catch (error) {
        console.error('Error fetching social data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId, dateRange]);

  const mockOverview = useMemo(() => ({
    total_posts: 42,
    published: 28,
    scheduled: 10,
    pending_approvals: 4,
    rejected: 0,
    platforms: {
      instagram: 20,
      facebook: 12,
      linkedin: 10
    }
  }), []);

  const overviewData = data || mockOverview;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Social Media" description="Acompanhe o desempenho, calendário e aprovações do conteúdo social." />
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">

        <TabsContent value="calendar" className="mt-0 pt-2">
          <ClientModuleTasksView module="social" view="kanban" />
        </TabsContent>

        <TabsContent value="approvals" className="mt-0 pt-2">
          <ClientModuleTasksView module="social" view="list" />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Posts</h3>
                <p className="text-3xl font-bold text-foreground">{overviewData.total_posts}</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Publicados</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500">{overviewData.published}</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Agendados</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{overviewData.scheduled}</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Aprovações Pendentes</h3>
                <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">{overviewData.pending_approvals}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-card p-6 rounded-lg border border-border shadow-sm min-h-[300px] flex items-center justify-center">
                 <p className="text-muted-foreground">Posts by Platform Chart Placeholder</p>
               </div>
               
               <div className="bg-card p-6 rounded-lg border border-border shadow-sm min-h-[300px] flex flex-col items-center justify-center">
                 <p className="text-muted-foreground">Content Status Donut Placeholder</p>
               </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Últimas Aprovações Pendentes</h2>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                 <p className="text-muted-foreground text-center py-8">Recent Approvals Widget Placeholder</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
