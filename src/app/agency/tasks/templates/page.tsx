import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { TemplateService } from '@/services/template.service';
import type { Template } from '@/services/template.service';
import { TemplateFormModal } from '@/components/modals/TemplateFormModal';
import { TemplateApplyModal } from '@/components/modals/TemplateApplyModal';
import { toast } from 'sonner';
import {
  Plus, Play, Pencil, Trash2, Loader2, FileText
} from 'lucide-react';

export function AgencyTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<Template | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await TemplateService.listTemplates();
      const fullTemplates = await Promise.all(
        data.map(t => TemplateService.getTemplate(t.id))
      );
      setTemplates(fullTemplates);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este template permanentemente?')) return;
    try {
      await TemplateService.deleteTemplate(id);
      toast.success('Template excluído!');
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleApply = (template: Template) => {
    setApplyingTemplate(template);
    setApplyOpen(true);
  };

  const openNew = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleSaved = () => {
    loadTemplates();
  };

  const handleApplied = () => {
    loadTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <PageHeader
          title="Gerenciar Templates"
          description="Crie e gerencie modelos de projetos com tarefas e subtarefas pré-configuradas."
        />
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum template ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie templates de projetos com tarefas e subtarefas pré-configuradas.</p>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{tmpl.name}</h3>
                      {tmpl.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mb-3">
                  <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-emerald-600">1</p>
                    <p className="text-[10px] text-muted-foreground">tarefa</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-blue-600">{tmpl.subtasks?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground">subtarefas</p>
                  </div>
                </div>

                <div className="text-xs text-foreground font-medium mb-2 truncate">
                  {tmpl.task_title}
                </div>

                <div className="space-y-1.5 mb-4">
                  {tmpl.subtasks?.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </div>
                  ))}
                  {(tmpl.subtasks?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground/50">+{(tmpl.subtasks?.length || 0) - 5} mais</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Button variant="default" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleApply(tmpl)}>
                    <Play className="w-3 h-3 mr-1" />
                    Aplicar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(tmpl)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(tmpl.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateFormModal
        template={editingTemplate}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <TemplateApplyModal
        template={applyingTemplate}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onApplied={handleApplied}
      />
    </div>
  );
}