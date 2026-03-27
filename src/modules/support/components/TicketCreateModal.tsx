import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupportService } from '../services/support.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TicketCreateModal({ isOpen, onClose, onSuccess }: TicketCreateModalProps) {
  const { clientId } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    
    if (!subject.trim() || !description.trim()) {
      toast.error('Preencha o assunto e a descrição.');
      return;
    }

    setIsSubmitting(true);
    try {
      await SupportService.createTicket(clientId, subject, description, priority);
      toast.success('Chamado de suporte aberto com sucesso!');
      setSubject('');
      setDescription('');
      setPriority('low');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao abrir chamado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Novo Chamado de Suporte</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Descreva detalhadamente sua dúvida ou problema para que nossa equipe possa ajudar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-zinc-300">Assunto</Label>
            <Input
              id="subject"
              placeholder="Ex: Dúvida sobre o relatório mensal"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="priority" className="text-zinc-300">Prioridade</Label>
             <Select value={priority} onValueChange={(val: 'low' | 'medium' | 'high') => setPriority(val)}>
               <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white focus:ring-blue-500">
                  <SelectValue placeholder="Selecione a prioridade..." />
               </SelectTrigger>
               <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                 <SelectItem value="low">Baixa — Dúvida geral, sem urgência</SelectItem>
                 <SelectItem value="medium">Média — Problema não impeditivo</SelectItem>
                 <SelectItem value="high">Alta — Urgência impeditiva</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Mensagem Detalhada</Label>
            <Textarea
              id="description"
              placeholder="Por favor, explique a situação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[120px] resize-y focus-visible:ring-blue-500"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Abrir Chamado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
