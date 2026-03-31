import { useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';

export function ClientGeneralPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Atividades Complementares" 
          description="Acompanhe tarefas gerais, solicitações avulsas e apoio operacional." 
        />
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4 bg-slate-100/50">
          <TabsTrigger value="kanban">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="general" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="general" view="list" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
