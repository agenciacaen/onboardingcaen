import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Rocket, Loader2, LayoutGrid, List, Milestone } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';
import { supabase } from '../../../services/supabase';
import type { Task } from '../../../types/general.types';
import { OnboardingRoadmap } from '../../../modules/onboarding/components/OnboardingRoadmap';
import { CompletionScreen } from '../../../modules/onboarding/components/CompletionScreen';
import { toast } from 'sonner';
import type { Client } from '../../../types/client.types';
import { NotificationService } from '../../../services/notification.service';

export function ClientOnboardingPage() {
  const { clientId } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'roadmap' | 'kanban' | 'list'>('roadmap');

  const loadData = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      // Busca dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData as Client);

      // Busca todas as tarefas de onboarding (pai + sub) desse cliente
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .or(`stage.in.(onboarding_phase_1,onboarding_phase_2),module.eq.onboarding`)
        .order('created_at', { ascending: true });

      if (taskError) throw taskError;
      setTasks((taskData as Task[]) || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados do onboarding.');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
    
    // Marcar notificações como lidas ao entrar na página
    if (clientId) {
      NotificationService.markAsReadByType(clientId, 'task');
    }
  }, [loadData, clientId]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Carregando seu roadmap...</p>
      </div>
    );
  }

  if (client?.onboarding_completed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding Concluído" description="Todas as etapas foram finalizadas." />
        <CompletionScreen clientName={client.name || 'Cliente'} />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding" description="Acompanhe a implantação dos seus serviços." />
        <EmptyState
          icon={Rocket}
          title="Nenhum plano ativo"
          description="A equipe ainda está preparando o seu roadmap de ativação. Em breve ele aparecerá aqui."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Roadmap de Ativação"
          description="Acompanhe cada etapa da implementação dos seus serviços."
        />
        
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('roadmap')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'roadmap' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'kanban' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
        </div>
      </div>

      <div className="mt-6">
        {viewMode === 'roadmap' ? (
          <OnboardingRoadmap
            tasks={tasks}
            readOnly={true}
          />
        ) : (
          <ClientModuleTasksView module="onboarding" view={viewMode === 'kanban' ? 'kanban' : 'list'} />
        )}
      </div>
    </div>
  );
}
