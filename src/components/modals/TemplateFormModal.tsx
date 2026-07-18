import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TemplateService } from '@/services/template.service';
import type { Template } from '@/services/template.service';
import { supabase } from '@/services/supabase';
import {
  Plus, X, Check, Loader2, ListChecks
} from 'lucide-react';

const MODULE_OPTIONS = [
  { value: 'traffic', label: 'Tráfego Pago' },
  { value: 'social', label: 'Redes Sociais' },
  { value: 'web', label: 'Web & SEO' },
  { value: 'crm', label: 'CRM e Tecnologia' },
  { value: 'general', label: 'Geral' },
  { value: 'onboarding', label: 'Onboarding / Implantação' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

interface TemplateFormModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function TemplateFormModal({ template, open, onOpenChange, onSaved }: TemplateFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('Projeto');
  const [taskDescription, setTaskDescription] = useState('');
  const [module, setModule] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [stage, setStage] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; description: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setTaskTitle(template.task_title);
        setTaskDescription(template.task_description || '');
        setModule(template.module);
        setPriority(template.priority);
        setStage(template.stage || '');
        setSubtasks(template.subtasks.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
        })));
      } else {
        setName('');
        setDescription('');
        setTaskTitle('Projeto');
        setTaskDescription('');
        setModule('general');
        setPriority('medium');
        setStage('');
        setSubtasks([]);
      }
    }
  }, [open, template]);

  const addSubtask = () => {
    setSubtasks(prev => [...prev, { id: genId(), title: '', description: '' }]);
  };

  const updateSubtask = (id: string, field: Partial<{ title: string; description: string }>) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...field } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }
    if (!taskTitle.trim()) {
      toast.error('Título da tarefa é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        task_title: taskTitle.trim(),
        task_description: taskDescription.trim() || undefined,
        module,
        priority,
        stage: stage || undefined,
        subtasks: subtasks.filter(s => s.title.trim()).map(s => ({
          title: s.title.trim(),
          description: s.description.trim() || undefined,
        })),
      };

      if (template) {
        await TemplateService.updateTemplate(template.id, payload);
        toast.success('Template atualizado!');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        await TemplateService.createTemplate(payload, user.id);
        toast.success('Template criado!');
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">
                {template ? 'Editar Template' : 'Novo Template'}
              </h2>
              <p className="text-xs text-muted-foreground/70">
                {template ? 'Modifique o template' : 'Crie um modelo reutilizável de projeto'}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(92vh - 130px)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome do Template</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: LP - Landing Page" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Objetivo do template..." className="h-9" />
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              Dados da Tarefa Principal
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título da Tarefa</label>
                <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Ex: Criação de Landing Page" className="h-9" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição da Tarefa</label>
                <Input value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Descrição opcional..." className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Módulo</label>
                <select
                  value={module}
                  onChange={e => setModule(e.target.value)}
                  className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Prioridade</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fase</label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value)}
                  className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Nenhum</option>
                  <option value="onboarding_phase_1">Onboarding — Fase 1</option>
                  <option value="onboarding_phase_2">Onboarding — Fase 2</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                Subtarefas ({subtasks.filter(s => s.title.trim()).length})
              </label>
              <button
                type="button" onClick={addSubtask}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto border border-border rounded-lg p-2">
              {subtasks.map((sub, si) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground/40 text-xs shrink-0">{si + 1}.</span>
                  <Input
                    value={sub.title}
                    onChange={e => updateSubtask(sub.id, { title: e.target.value })}
                    placeholder="Título da subtarefa..."
                    className="h-7 text-xs flex-1"
                  />
                  <button type="button" onClick={() => removeSubtask(sub.id)}
                    className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  Nenhuma subtarefa. Clique em "Adicionar".
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-3 bg-card flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {subtasks.filter(s => s.title.trim()).length > 0 && (
              <span>Total: <strong>1</strong> tarefa e <strong>{subtasks.filter(s => s.title.trim()).length}</strong> subtarefa(s).</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              Salvar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
