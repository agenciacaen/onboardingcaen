import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { OnboardingRoadmap } from "@/modules/onboarding/components/OnboardingRoadmap";
import { AutomationService } from "@/services/automation.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Rocket, Zap, Loader2 } from "lucide-react";
import type { Task } from "@/types/general.types";

export default function AgencyClientOnboardingPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [onboardingTasks, setOnboardingTasks] = useState<Task[]>([]);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);
  const [initializingPhase1, setInitializingPhase1] = useState(false);
  const [generatingPhase2, setGeneratingPhase2] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchOnboardingTasks = useCallback(async () => {
    if (!id) return;
    setLoadingOnboarding(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', id)
        .in('stage', ['onboarding_phase_1', 'onboarding_phase_2'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOnboardingTasks((data as Task[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas de onboarding:', err);
    } finally {
      setLoadingOnboarding(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOnboardingTasks();
  }, [fetchOnboardingTasks]);

  const handleInitializeOnboarding = async () => {
    if (!id || !user?.id) return;
    setInitializingPhase1(true);
    try {
      const { data: flows } = await supabase
        .from('flows')
        .select('id')
        .or('name.ilike.%Onboarding%,name.ilike.%Estratégia%')
        .limit(1);

      if (flows && flows.length > 0) {
        await AutomationService.executeFlow(flows[0].id, id, user.id);
        toast.success('Onboarding inicializado com sucesso!');
      } else {
        await AutomationService.initializeOnboarding(id, user.id);
        toast.success('Onboarding inicializado!');
      }

      await fetchOnboardingTasks();
    } catch (error) {
      console.error('Erro ao inicializar onboarding:', error);
      toast.error('Erro ao inicializar onboarding.');
    } finally {
      setInitializingPhase1(false);
    }
  };

  const handleGeneratePhase2 = async () => {
    if (!id || !user?.id) return;
    setGeneratingPhase2(true);
    try {
      await AutomationService.generatePhase2(id, user.id);
      toast.success('Fase 2 gerada com sucesso!');
      await fetchOnboardingTasks();
    } catch (error) {
      console.error('Erro ao gerar Fase 2:', error);
      toast.error('Erro ao gerar Fase 2.');
    } finally {
      setGeneratingPhase2(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: string) => {
    setTogglingId(subtaskId);
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', subtaskId);

      if (error) throw error;

      const updatedTasks = onboardingTasks.map(t =>
        t.id === subtaskId
          ? { ...t, status: newStatus as Task['status'], completed_at: newStatus === 'done' ? new Date().toISOString() : undefined }
          : t
      );

      setOnboardingTasks(updatedTasks);

      // Se marcou como done, verificar se todas as subtarefas do pai foram concluídas
      if (newStatus === 'done') {
        const subtask = onboardingTasks.find(t => t.id === subtaskId);
        const parentId = subtask?.parent_id;
        if (parentId) {
          const allSubs = updatedTasks.filter(t => t.parent_id === parentId);
          const allDone = allSubs.every(t => t.status === 'done');
          if (allDone && allSubs.length > 0) {
            const { error: parentError } = await supabase
              .from('tasks')
              .update({ status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq('id', parentId);

            if (!parentError) {
              setOnboardingTasks(prev =>
                prev.map(t =>
                  t.id === parentId ? { ...t, status: 'done' as Task['status'], completed_at: new Date().toISOString() } : t
                )
              );
              toast.success('Todas as subtarefas concluídas! Etapa finalizada.');
            }
          }
        }
      }

      toast.success(newStatus === 'done' ? 'Item concluído!' : 'Item reaberto.');
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Não foi possível atualizar.');
    } finally {
      setTogglingId(null);
    }
  };

  const hasPhase1 = onboardingTasks.some(t => t.stage === 'onboarding_phase_1');
  const hasPhase2 = onboardingTasks.some(t => t.stage === 'onboarding_phase_2');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          variant={hasPhase1 ? "outline" : "default"}
          onClick={handleInitializeOnboarding}
          disabled={initializingPhase1}
          className={!hasPhase1 ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          {initializingPhase1 ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4 mr-2" />
          )}
          {hasPhase1 ? 'Reinicializar Fase 1' : 'Inicializar Onboarding'}
        </Button>

        {hasPhase1 && (
          <Button
            variant={hasPhase2 ? "outline" : "default"}
            onClick={handleGeneratePhase2}
            disabled={generatingPhase2}
            className={!hasPhase2 ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            {generatingPhase2 ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {hasPhase2 ? 'Regenerar Fase 2' : 'Gerar Fase 2'}
          </Button>
        )}
      </div>

      {loadingOnboarding ? (
        <div className="flex items-center justify-center p-8 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : onboardingTasks.length > 0 ? (
        <OnboardingRoadmap
          tasks={onboardingTasks}
          onToggleSubtask={handleToggleSubtask}
          isToggling={togglingId}
        />
      ) : (
        <div className="text-center py-12 text-zinc-500">
          <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum onboarding ativo. Clique no botão acima para inicializar.</p>
        </div>
      )}
    </div>
  );
}
