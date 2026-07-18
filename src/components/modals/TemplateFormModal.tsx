import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TemplateService } from '@/services/template.service';
import type { Template } from '@/services/template.service';
import { supabase } from '@/services/supabase';
import {
  Plus, Trash2, X, Check, Loader2, ListChecks
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

interface TaskFormItem {
  id: string;
  title: string;
  description: string;
  module: string;
  priority: string;
  stage: string;
  subtasks: { id: string; title: string; description: string }[];
}

export function TemplateFormModal({ template, open, onOpenChange, onSaved }: TemplateFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<TaskFormItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setTasks(template.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          module: t.module,
          priority: t.priority,
          stage: t.stage || '',
          subtasks: t.subtasks.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
          })),
        })));
      } else {
        setName('');
        setDescription('');
        setTasks([]);
      }
    }
  }, [open, template]);

  const addTask = () => {
    setTasks(prev => [...prev, {
      id: genId(),
      title: '',
      description: '',
      module: 'general',
      priority: 'medium',
      stage: '',
      subtasks: [],
    }]);
  };

  const updateTask = (index: number, field: Partial<TaskFormItem>) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, ...field } : t));
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const addSubtask = (taskIndex: number) => {
    setTasks(prev => prev.map((t, i) => i === taskIndex ? {
      ...t,
      subtasks: [...t.subtasks, { id: genId(), title: '', description: '' }],
    } : t));
  };

  const updateSubtask = (taskIndex: number, subId: string, field: Partial<{ title: string; description: string }>) => {
    setTasks(prev => prev.map((t, i) => i === taskIndex ? {
      ...t,
      subtasks: t.subtasks.map(s => s.id === subId ? { ...s, ...field } : s),
    } : t));
  };

  const removeSubtask = (taskIndex: number, subId: string) => {
    setTasks(prev => prev.map((t, i) => i === taskIndex ? {
      ...t,
      subtasks: t.subtasks.filter(s => s.id !== subId),
    } : t));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }
    const validTasks = tasks.filter(t => t.title.trim());
    if (validTasks.length === 0) {
      toast.error('Adicione pelo menos uma tarefa');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        tasks: validTasks.map(t => ({
          title: t.title.trim(),
          description: t.description.trim() || undefined,
          module: t.module,
          priority: t.priority,
          stage: t.stage || undefined,
          subtasks: t.subtasks.filter(s => s.title.trim()).map(s => ({
            title: s.title.trim(),
            description: s.description.trim() || undefined,
          })),
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
      <DialogContent className="sm:max-w-[800px] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-xl">
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
                {template ? 'Modifique as tarefas e subtarefas' : 'Crie um modelo reutilizável de projeto'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(92vh - 130px)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome do Template</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding Completo" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Objetivo do template..." className="h-9" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">
                Tarefas do Template ({tasks.length})
              </h3>
              <Button variant="outline" size="sm" onClick={addTask} className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                + Tarefa
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground/50">
                <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhuma tarefa ainda.</p>
                <p className="text-xs mt-1">Adicione tarefas e configure as subtarefas de cada uma.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, ti) => (
                  <div key={task.id} className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {ti + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Input
                          value={task.title}
                          onChange={e => updateTask(ti, { title: e.target.value })}
                          placeholder="Título da tarefa..."
                          className="h-8 text-sm font-semibold"
                        />
                      </div>
                      <button type="button" onClick={() => removeTask(ti)}
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="px-4 pb-4 space-y-3 pt-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição da Tarefa</label>
                        <Input
                          value={task.description}
                          onChange={e => updateTask(ti, { description: e.target.value })}
                          placeholder="Descrição opcional..."
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Módulo</label>
                          <select
                            value={task.module}
                            onChange={e => updateTask(ti, { module: e.target.value })}
                            className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Prioridade</label>
                          <select
                            value={task.priority}
                            onChange={e => updateTask(ti, { priority: e.target.value })}
                            className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fase/Stage</label>
                          <select
                            value={task.stage}
                            onChange={e => updateTask(ti, { stage: e.target.value })}
                            className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Nenhum</option>
                            <option value="onboarding_phase_1">Onboarding — Fase 1</option>
                            <option value="onboarding_phase_2">Onboarding — Fase 2</option>
                            <option value="custom">Personalizado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5" />
                            Subtarefas ({task.subtasks.length})
                          </label>
                          <button
                            type="button" onClick={() => addSubtask(ti)}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {task.subtasks.map((sub, si) => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <span className="text-muted-foreground/40 text-xs shrink-0">{si + 1}.</span>
                              <Input
                                value={sub.title}
                                onChange={e => updateSubtask(ti, sub.id, { title: e.target.value })}
                                placeholder="Título da subtarefa..."
                                className="h-7 text-xs flex-1"
                              />
                              <button type="button" onClick={() => removeSubtask(ti, sub.id)}
                                className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {task.subtasks.length === 0 && (
                            <p className="text-xs text-muted-foreground/60 text-center py-2">
                              Nenhuma subtarefa. Clique em "Adicionar".
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-6 py-3 bg-card flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {tasks.filter(t => t.title.trim()).length > 0 && (
              <span>Total: <strong>{tasks.filter(t => t.title.trim()).length}</strong> tarefa(s) e <strong>{tasks.reduce((acc, t) => acc + t.subtasks.filter(s => s.title.trim()).length, 0)}</strong> subtarefa(s).</span>
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
