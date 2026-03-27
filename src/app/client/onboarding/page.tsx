import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Rocket, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { OnboardingService } from '../../../modules/onboarding/services/onboarding.service';
import type { Flow, FlowProgress, FlowStep } from '../../../modules/onboarding/types';
import type { Client } from '../../../types/client.types';
import { OnboardingProgressBar } from '../../../modules/onboarding/components/OnboardingProgressBar';
import { OnboardingChecklist } from '../../../modules/onboarding/components/OnboardingChecklist';
import { OnboardingStepDetail } from '../../../modules/onboarding/components/OnboardingStepDetail';
import { CompletionScreen } from '../../../modules/onboarding/components/CompletionScreen';
import { toast } from 'sonner';

export function ClientOnboardingPage() {
  const { clientId } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [progress, setProgress] = useState<FlowProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompletingStep, setIsCompletingStep] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!clientId) return;
      
      const clientData = await OnboardingService.getClientData(clientId);
      setClient(clientData);

      if (!clientData.onboarding_completed) {
        const onboardingData = await OnboardingService.getOnboardingData(clientId);
        setFlow(onboardingData.flow);
        setProgress(onboardingData.progress);
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      console.error('Erro ao carregar dados:', error);
      if (error.code !== 'PGRST116') {
        toast.error('Erro ao carregar fluxo de ativação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepClick = (step: FlowStep) => {
    setSelectedStep(step);
    setIsDetailOpen(true);
  };

  const handleCompleteStep = async () => {
    if (!clientId || !flow || !selectedStep || !progress) return;
    
    setIsCompletingStep(true);
    try {
      const updatedProgress = await OnboardingService.completeStep(clientId, flow.id, selectedStep.step);
      setProgress(updatedProgress);
      setIsDetailOpen(false);
      toast.success(`Etapa ${selectedStep.step} concluída!`);

      // Verifica se todas foram concluídas
      if (updatedProgress.completed_steps.length >= flow.steps.length) {
        await OnboardingService.completeOnboardingClient(clientId);
        setClient((prev) => prev ? { ...prev, onboarding_completed: true, status: 'active' } : null);
        toast.success('Onboarding finalizado com sucesso!');
      }

    } catch (error) {
      console.error('Erro ao concluir etapa:', error);
      toast.error('Não foi possível concluir a etapa. Tente novamente.');
    } finally {
      setIsCompletingStep(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Carregando ativação...</p>
      </div>
    );
  }

  if (client?.onboarding_completed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding Concluído" description="Acompanhe a implantação inicial." />
        <CompletionScreen clientName={client.name || 'Cliente'} />
      </div>
    );
  }

  if (!flow || !progress) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding" description="Acompanhe a implantação inicial." />
        <EmptyState 
          icon={Rocket} 
          title="Nenhum fluxo encontrado" 
          description="Ainda não existe um fluxo de ativação configurado para sua conta." 
        />
      </div>
    );
  }

  const isSelectedCompleted = progress.completed_steps.includes(selectedStep?.step || 0);
  const isSelectedCurrent = progress.current_step === selectedStep?.step && !isSelectedCompleted;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader title="Bem-vindo(a) a bordo!" description="Siga as etapas abaixo para ativarmos todos os seus serviços." />
      
      <OnboardingProgressBar 
        currentStep={progress.completed_steps.length} 
        totalSteps={flow.steps.length} 
        isCompleted={client?.onboarding_completed || false} 
      />

      <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
        <OnboardingChecklist 
          steps={flow.steps}
          currentStep={progress.current_step}
          completedSteps={progress.completed_steps}
          onStepClick={handleStepClick}
          isLoadingStep={isCompletingStep}
        />
      </div>

      <OnboardingStepDetail 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        step={selectedStep}
        isCompleted={isSelectedCompleted}
        isCurrent={isSelectedCurrent}
        onComplete={handleCompleteStep}
        isLoading={isCompletingStep}
      />
    </div>
  );
}
