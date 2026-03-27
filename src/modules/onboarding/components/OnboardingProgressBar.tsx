import { Progress } from '@/components/ui/progress';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
}

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
  isCompleted,
}: OnboardingProgressBarProps) {
  const percentage = isCompleted ? 100 : Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full space-y-2 mb-8 bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400 font-medium">
          Progresso de Ativação
        </span>
        <span className="text-white font-bold">
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2 bg-zinc-800" />
      <div className="text-xs text-zinc-500 mt-1">
        {isCompleted 
          ? 'Onboarding concluído com sucesso!'
          : `Etapa ${currentStep} de ${totalSteps}`}
      </div>
    </div>
  );
}
