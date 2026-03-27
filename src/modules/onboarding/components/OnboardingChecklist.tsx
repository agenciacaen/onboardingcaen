import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { FlowStep } from '../types';

interface OnboardingChecklistProps {
  steps: FlowStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: FlowStep) => void;
  isLoadingStep: boolean;
}

export function OnboardingChecklist({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: OnboardingChecklistProps) {
  return (
    <div className="space-y-4">
      {steps.sort((a,b) => a.order - b.order).map((step) => {
        const isCompleted = completedSteps.includes(step.step);
        const isCurrent = currentStep === step.step && !isCompleted;
        const isPending = !isCompleted && !isCurrent;

        return (
          <div
            key={step.step}
            onClick={() => onStepClick(step)}
            className={`
              relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group
              ${isCompleted ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : ''}
              ${isCurrent ? 'bg-blue-950/20 border-blue-900/50 hover:border-blue-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}
              ${isPending ? 'bg-zinc-950/50 border-white/5 hover:border-white/10 opacity-75' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isCompleted && (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
              {isCurrent && (
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-20"></span>
                  <CircleDot className="relative w-6 h-6 text-blue-500" />
                </div>
              )}
              {isPending && (
                <Circle className="w-6 h-6 text-zinc-600 transition-colors group-hover:text-zinc-500" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={`font-semibold text-base mb-1 ${isCompleted ? 'text-zinc-300 line-through decoration-zinc-600' : 'text-zinc-100'}`}>
                {step.title}
              </h3>
              <p className={`text-sm ${isCompleted ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {step.description}
              </p>
            </div>
            
            {(isCurrent || isCompleted) && (
              <div className="self-center">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  isCompleted 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                  {isCompleted ? 'Concluído' : 'Etapa Atual'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
