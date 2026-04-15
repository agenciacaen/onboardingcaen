import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';
import { LayoutDashboard } from 'lucide-react';

// FORCE UPDATE: 2026-03-31T21:26:45Z
// Removed unused useState to fix Vercel Build Error

export function ClientGeneralPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Atividades Complementares" 
          description="Acompanhe tarefas gerais, solicitações avulsas e apoio operacional." 
        />
      </div>

      <Tabs value={activeTab} className="w-full">

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="general" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="general" view="list" />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 pt-2">
          <div className="bg-white p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-4">
             <div className="p-4 bg-slate-50 rounded-full">
               <LayoutDashboard className="w-8 h-8 text-slate-300" />
             </div>
             <div>
               <h3 className="text-lg font-semibold text-slate-900">Dashboard Geral</h3>
               <p className="text-sm text-slate-500 max-w-xs">Estatísticas e indicadores consolidados das atividades de apoio estão sendo configurados.</p>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
