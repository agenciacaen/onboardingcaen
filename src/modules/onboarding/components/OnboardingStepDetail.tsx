import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { FlowStep } from '../types';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingStepDetailProps {
  step: FlowStep | null;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
  isCurrent: boolean;
  onComplete: () => void;
  isLoading: boolean;
}

export function OnboardingStepDetail({
  step,
  isOpen,
  onClose,
  isCompleted,
  isCurrent,
  onComplete,
  isLoading,
}: OnboardingStepDetailProps) {
  if (!step) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-zinc-950 border-zinc-800 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">
              Etapa {step.step}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </span>
            )}
          </div>
          <SheetTitle className="text-xl text-white">{step.title}</SheetTitle>
          <SheetDescription className="text-zinc-400 mt-2">
            {step.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
            {/* Aqui poderia haver um markdown renderer se a descrição for markdown. Assumindo texto normal por enquanto. */}
            <p>{step.description}</p>
            <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mt-4">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                Instruções
              </h4>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Siga as orientações acima e certifique-se de que a etapa está totalmente configurada.
                Esta ação informará a agência sobre o seu progresso.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            {isCompleted ? (
              <Button 
                className="w-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 pointer-events-none"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Etapa já concluída
              </Button>
            ) : isCurrent ? (
              <Button 
                onClick={onComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Concluindo...' : 'Concluir esta etapa'}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            ) : (
              <Button 
                className="w-full bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                variant="outline"
              >
                Conclua as etapas anteriores primeiro
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
