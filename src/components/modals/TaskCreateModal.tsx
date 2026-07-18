import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TemplateService } from "@/services/template.service";
import { Loader2 } from "lucide-react";

const createTaskSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  client_id: z.string().min(1, "Selecione o cliente"),
  module: z.enum(['traffic', 'social', 'web', 'crm', 'general', 'onboarding']),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
  stage: z.string().optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultModule?: 'traffic' | 'social' | 'web' | 'crm' | 'general' | 'onboarding';
}

export function TaskCreateModal({
  open,
  onOpenChange,
  onSuccess,
  defaultModule = 'general',
}: TaskCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [team, setTeam] = useState<{ id: string; full_name: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [applyMode, setApplyMode] = useState<'single' | 'full'>('single');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: "todo",
      priority: "medium",
      module: defaultModule,
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        client_id: '',
        module: 'general',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        stage: '',
      });
      setSelectedTemplateId('');
      setSelectedTemplate(null);
      setSelectedTaskId('');
      setApplyMode('single');
      fetchData();
    }
  }, [open, reset]);

  const fetchData = async () => {
    const [clientsRes, teamRes, templatesRes] = await Promise.all([
      supabase.from("clients").select("id, name").in('status', ['active', 'onboarding']),
      supabase.from("profiles").select("id, full_name").in("role", ["admin", "member"]),
      supabase.from("project_templates").select("id, name").order('name'),
    ]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (teamRes.data) setTeam(teamRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
  };

  const clientId = watch("client_id");
  const moduleVal = watch("module");
  const priorityVal = watch("priority");
  const assignedTo = watch("assigned_to");
  const stageVal = watch("stage");

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedTaskId('');
    if (!templateId || templateId === 'none') {
      setSelectedTemplate(null);
      return;
    }
    try {
      const tmpl = await TemplateService.getTemplate(templateId);
      setSelectedTemplate(tmpl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId && selectedTemplate) {
      const task = selectedTemplate.tasks.find((t: any) => t.id === taskId);
      if (task) {
        setValue("title", task.title);
        setValue("description", task.description || '');
        setValue("module", task.module);
        setValue("priority", task.priority);
        setValue("stage", task.stage || '');
      }
    }
  };

  const onSubmit = async (data: CreateTaskFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (selectedTemplateId && selectedTemplate) {
        if (applyMode === 'full') {
          await TemplateService.applyTemplate(selectedTemplateId, data.client_id, user.id);
          toast.success("Template aplicado com sucesso!");
        } else {
          const task = selectedTemplate.tasks.find((t: any) => t.id === selectedTaskId);
          if (task) {
            const { data: parent, error: parentErr } = await supabase.from('tasks').insert({
              client_id: data.client_id,
              title: task.title,
              description: task.description || '',
              module: task.module,
              status: 'todo',
              priority: task.priority,
              created_by: user.id,
              stage: task.stage || null,
            }).select('id').single();

            if (parentErr) throw parentErr;

            if (task.subtasks && task.subtasks.length > 0) {
              const subs = task.subtasks.map((s: any, idx: number) => ({
                client_id: data.client_id,
                parent_id: parent.id,
                title: s.title,
                description: s.description || '',
                module: task.module,
                status: 'todo',
                priority: task.priority,
                created_by: user.id,
                stage: task.stage || null,
                order: idx,
              }));
              const { error: subsErr } = await supabase.from('tasks').insert(subs);
              if (subsErr) throw subsErr;
            }
          }
        }
        toast.success("Template aplicado com sucesso!");
      } else {
        const { error } = await supabase.from('tasks').insert({
          title: data.title,
          description: data.description,
          client_id: data.client_id,
          module: data.module,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date || null,
          assigned_to: (data.assigned_to === 'unassigned' || !data.assigned_to) ? null : data.assigned_to,
          stage: (data.stage === 'none' || !data.stage) ? null : data.stage,
          created_by: user.id,
        });

        if (error) throw error;
        toast.success("Tarefa criada com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label>Usar Template (Opcional)</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger><SelectValue placeholder="Nenhum template..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum template</SelectItem>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  Template: {selectedTemplate.name}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyMode('single')}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${applyMode === 'single' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    Tarefa Única
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyMode('full')}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${applyMode === 'full' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    Template Completo
                  </button>
                </div>
              </div>

              {applyMode === 'full' ? (
                <div className="text-xs text-muted-foreground">
                  <p>O template completo será aplicado: <strong>{selectedTemplate.tasks.length}</strong> tarefa(s) e <strong>{selectedTemplate.tasks.reduce((acc: number, t: any) => acc + (t.subtasks?.length || 0), 0)}</strong> subtarefa(s).</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Selecione a Tarefa</label>
                  <Select value={selectedTaskId} onValueChange={handleTaskSelect}>
                    <SelectTrigger><SelectValue placeholder="Escolha uma tarefa..." /></SelectTrigger>
                    <SelectContent>
                      {selectedTemplate.tasks.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title} ({t.subtasks?.length || 0} sub)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {applyMode === 'single' && selectedTaskId && selectedTemplate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {(() => {
                    const task = selectedTemplate.tasks.find((t: any) => t.id === selectedTaskId);
                    return task ? (
                      <p>Subtarefas: <strong>{task.subtasks?.length || 0}</strong></p>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          {(!selectedTemplateId || (applyMode === 'single')) && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label>Título</Label>
                <Input {...register("title")} placeholder="Descreva a tarefa..." />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label>Descrição</Label>
                <Textarea {...register("description")} placeholder="Detalhes adicionais..." />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={(val) => setValue("client_id", val)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label>Módulo</Label>
              <Select value={moduleVal} onValueChange={(val) => setValue("module", val as CreateTaskFormValues['module'])}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="traffic">Tráfego Pago</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="web">Desenvolvimento Web</SelectItem>
                  <SelectItem value="crm">CRM e Tecnologia</SelectItem>
                  <SelectItem value="onboarding">Onboarding / Implantação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>Prioridade</Label>
              <Select value={priorityVal} onValueChange={(val) => setValue("priority", val as CreateTaskFormValues['priority'])}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label>Prazo (Opcional)</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Responsável (Opcional)</Label>
            <Select value={assignedTo} onValueChange={(val) => setValue("assigned_to", val)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="unassigned">Não atribuído</SelectItem>
                {team.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Etapa / Fase (Opcional)</Label>
            <Select value={stageVal} onValueChange={(val) => setValue("stage", val)}>
              <SelectTrigger><SelectValue placeholder="Selecione a fase..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geral / Não Definido</SelectItem>
                <SelectItem value="onboarding_phase_1">Fase 1 — Setup Inicial</SelectItem>
                <SelectItem value="onboarding_phase_2">Fase 2 — Escalabilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {selectedTemplateId && applyMode === 'full' ? 'Aplicar Template' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
