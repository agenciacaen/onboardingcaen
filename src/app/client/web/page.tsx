import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { webService } from '@/services/web.service';
import type { WebOverview } from '@/types/web.types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';

export function ClientWebPage() {
  const { clientId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WebOverview | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!clientId) return;
      
      try {
        setIsLoading(true);
        const overview = await webService.getWebOverview(clientId);
        setData(overview);
      } catch (error) {
        console.error('Error fetching web data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  const mockOverview = useMemo(() => ({
    active_pages: 15,
    avg_seo_score: 82,
    deliveries_completed: 5,
    deliveries_in_progress: 2,
    last_audit: {
      date: '2026-03-20',
      scores: { seo: 82, performance: 75, accessibility: 90 }
    }
  }), []);

  const overviewData = data || mockOverview;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Desenvolvimento Web" description="Acompanhe o desempenho do site, auditorias e métricas de SEO." />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 bg-slate-100/50">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kanban">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Páginas Ativas</h3>
                <p className="text-3xl font-bold">{overviewData.active_pages}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">SEO Score Médio</h3>
                <p className={`text-3xl font-bold ${overviewData.avg_seo_score >= 80 ? 'text-green-600' : 'text-amber-500'}`}>
                  {overviewData.avg_seo_score}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Entregas Concluídas</h3>
                <p className="text-3xl font-bold text-blue-600">{overviewData.deliveries_completed}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Entregas em Andamento</h3>
                <p className="text-3xl font-bold text-purple-600">{overviewData.deliveries_in_progress}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-5 bg-white p-6 rounded-lg border shadow-sm min-h-[400px] flex items-center justify-center">
                 <p className="text-gray-400">Audit Score Radar Placeholder</p>
               </div>
               
               <div className="lg:col-span-7 bg-white p-6 rounded-lg border shadow-sm min-h-[400px]">
                 <h2 className="text-lg font-semibold mb-4">Progresso de Entregas</h2>
                 <div className="flex items-center justify-center py-12">
                   <p className="text-gray-400">Delivery Progress Widget Placeholder</p>
                 </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="web" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="web" view="list" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
