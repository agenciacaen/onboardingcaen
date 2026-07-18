import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TemplateService } from '@/services/template.service';
import type { Template } from '@/services/template.service';
import { supabase } from '@/services/supabase';
import { Loader2, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateApplyModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}

export function TemplateApplyModal({ template, open, onOpenChange, onApplied }: TemplateApplyModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedClient('');
      supabase.from('clients').select('id, name').in('status', ['active', 'onboarding'])
        .then(({ data }) => { if (data) setClients(data); });
    }
  }, [open]);

  const handleApply = async () => {
    if (!template || !selectedClient) return;
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { tasksCreated } = await TemplateService.applyTemplate(template.id, selectedClient, user.id);
      toast.success(`Template aplicado! ${tasksCreated} tarefa(s) criada(s).`);
      onApplied();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao aplicar template');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Aplicar Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">{template?.name}</p>
            {template?.description && (
              <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
            )}
            <p className="text-xs text-muted-foreground mb-1">
              Este template criará <strong>{template?.tasks.length}</strong> tarefa(s) e <strong>{template?.tasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0)}</strong> subtarefa(s).
            </p>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply} disabled={!selectedClient || applying}>
            {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Aplicar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}