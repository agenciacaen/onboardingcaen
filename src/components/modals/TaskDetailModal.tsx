import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  CheckSquare, Square, Loader2, Send, MessageSquare,
  Clock, User, Tag, ListChecks, X, Plus, Trash2,
  ChevronDown, Pencil, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================
// TYPES
// ============================================================
export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  module: string;
  client_id?: string;
  stage?: string;
  parent_id?: string | null;
  clients?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface SubtaskData {
  id: string;
  title: string;
  description?: string;
  status: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string } | null;
}

interface TaskDetailModalProps {
  task: TaskData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtasks?: SubtaskData[];
  onSubtaskToggle?: (subtaskId: string, newStatus: string) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: (taskId: string) => void;
  readOnly?: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================
const STATUS_OPTIONS = [
  { value: 'todo',        label: 'A Fazer',      bg: 'bg-slate-100',   text: 'text-slate-700' },
  { value: 'in_progress', label: 'Em Progresso',  bg: 'bg-blue-100',    text: 'text-blue-700' },
  { value: 'review',      label: 'Revisão',       bg: 'bg-amber-100',   text: 'text-amber-700' },
  { value: 'done',        label: 'Concluído',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa',   bg: 'bg-slate-100',  text: 'text-slate-600' },
  { value: 'medium', label: 'Média',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { value: 'high',   label: 'Alta',    bg: 'bg-orange-100', text: 'text-orange-700' },
  { value: 'urgent', label: 'Urgente', bg: 'bg-red-100',    text: 'text-red-700' },
];

const MODULE_OPTIONS = [
  { value: 'social',  label: 'Redes Sociais',   bg: 'bg-pink-100',    text: 'text-pink-700' },
  { value: 'traffic', label: 'Tráfego Pago',    bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  { value: 'web',     label: 'Web & SEO',       bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { value: 'crm',     label: 'CRM e Tecnologia',bg: 'bg-purple-100',  text: 'text-purple-700' },
  { value: 'general', label: 'Geral',           bg: 'bg-slate-100',   text: 'text-slate-700' },
];

// ============================================================
// INLINE EDIT FIELD (click-to-edit)
// ============================================================
function InlineEdit({
  value, onSave, multiline = false,
  placeholder = 'Clique para editar...', className = '',
  readOnly = false,
}: {
  value: string; onSave: (v: string) => Promise<void>; multiline?: boolean;
  placeholder?: string; className?: string; readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const save = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    const commonProps = {
      ref: ref as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: save,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter' && !multiline) save();
        if (e.key === 'Enter' && multiline && e.ctrlKey) save();
      },
      className: cn('text-sm bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-200', className),
      disabled: saving,
    };

    return multiline
      ? <textarea {...commonProps} rows={3} ref={ref as React.RefObject<HTMLTextAreaElement>} />
      : <input {...commonProps} type="text" ref={ref as React.RefObject<HTMLInputElement>} />;
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-1 rounded px-1 -mx-1 transition-colors',
        !readOnly && 'cursor-pointer hover:bg-slate-50',
        className
      )}
      onClick={() => !readOnly && setEditing(true)}
    >
      <span className={cn('flex-1 min-w-0', !value && 'text-slate-400 italic text-sm')}>
        {value || placeholder}
      </span>
      {!readOnly && <Pencil className="w-3 h-3 text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

// ============================================================
// DROPDOWN SELECT (Badge-style)
// ============================================================
function BadgeSelect({
  options, value, onSelect, readOnly = false
}: {
  options: { value: string; label: string; bg: string; text: string }[];
  value: string;
  onSelect: (v: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = options.find(o => o.value === value) || options[0];

  const handle = async (v: string) => {
    if (v === value) { setOpen(false); return; }
    setSaving(true);
    await onSelect(v);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !readOnly && setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-opacity',
          !readOnly && 'cursor-pointer',
          current.bg, current.text, saving && 'opacity-60 pointer-events-none'
        )}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : current.label}
        {!readOnly && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 transition-colors',
                opt.value === value && 'font-semibold'
              )}
              onClick={() => handle(opt.value)}
            >
              <span className={cn('w-2 h-2 rounded-full', opt.bg.replace('bg-', 'bg-').replace('-100', '-400'))} />
              {opt.label}
              {opt.value === value && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function TaskDetailModal({
  task: initialTask, open, onOpenChange, subtasks: initialSubtasks = [],
  onSubtaskToggle, onTaskUpdated, onTaskDeleted, readOnly = false
}: TaskDetailModalProps) {
  const { user } = useAuthStore();

  // Local mutable copy of task fields
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  // Local mutable subtasks (so we can add/delete without re-fetching parent)
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New subtask field
  const [newSubTitle, setNewSubTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  // Sync fresh data from parent
  useEffect(() => {
    if (open && initialTask) {
      setTaskData({ ...initialTask });
      setSubtasks([...(initialSubtasks || [])]);
    }
    if (!open) {
      setComments([]);
      setNewComment('');
      setShowAddSubtask(false);
      setNewSubTitle('');
    }
  }, [open, initialTask, initialSubtasks]);

  // ---- Comments ----
  const loadComments = useCallback(async () => {
    if (!taskData) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, content, created_at, author:profiles!task_comments_author_id_fkey(full_name)')
        .eq('task_id', taskData.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments((data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string, content: c.content as string,
        created_at: c.created_at as string,
        author: c.author as { full_name: string } | null,
      })));
    } catch (error) { 
      console.error('Task detail error:', error);
      /* silent */ 
    }
    finally { setLoadingComments(false); }
  }, [taskData]);

  useEffect(() => {
    if (open && taskData) loadComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskData?.id]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !taskData || !user) return;
    setSendingComment(true);
    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: taskData.id, author_id: user.id, content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      await loadComments();
      toast.success('Nota adicionada!');
    } catch (error) { 
      console.error('Note add error:', error);
      toast.error('Não foi possível enviar a nota.'); 
    }
    finally { setSendingComment(false); }
  };

  // ---- Task field updates ----
  const updateTaskField = async (field: string, value: string) => {
    if (!taskData) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', taskData.id);
    
    if (error) { 
      toast.error('Erro ao salvar.'); 
      return; 
    }

    // Se mudarmos o módulo ou cliente, propagamos para as subtarefas para garantir a "integração 100%"
    if (field === 'module' || field === 'client_id') {
      await supabase
        .from('tasks')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('parent_id', taskData.id);
    }

    setTaskData(prev => prev ? { ...prev, [field]: value } : prev);
    onTaskUpdated?.();
  };

  // ---- Subtask toggle ----
  const handleToggle = async (subId: string, currentStatus: string) => {
    setTogglingId(subId);
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const payload: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'done') payload.completed_at = new Date().toISOString();
    else payload.completed_at = null;
    try {
      const { error } = await supabase.from('tasks').update(payload).eq('id', subId);
      if (error) throw error;
      setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
      onSubtaskToggle?.(subId, newStatus);
      onTaskUpdated?.();
    } catch (error) { 
      console.error('Update task error:', error);
      toast.error('Não foi possível atualizar.'); 
    }
    finally { setTogglingId(null); }
  };

  // ---- Subtask title edit ----
  const handleEditSubtaskTitle = async (subId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('tasks').update({ title: newTitle.trim(), updated_at: new Date().toISOString() }).eq('id', subId);
    if (error) { toast.error('Erro ao salvar.'); return; }
    setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, title: newTitle.trim() } : s));
    onTaskUpdated?.();
  };

  // ---- Add subtask ----
  const handleAddSubtask = async () => {
    if (!newSubTitle.trim() || !taskData || !user) return;
    setAddingSubtask(true);
    try {
      const { data, error } = await supabase.from('tasks').insert({
        title: newSubTitle.trim(),
        parent_id: taskData.id,
        client_id: taskData.client_id,
        module: taskData.module,
        stage: taskData.stage,
        status: 'todo',
        priority: 'medium',
        created_by: user.id,
      }).select('id, title, status').single();
      if (error) throw error;
      setSubtasks(prev => [...prev, { id: data.id, title: data.title, status: data.status }]);
      setNewSubTitle('');
      toast.success('Subtarefa adicionada!');
      onTaskUpdated?.();
    } catch (error) { 
      console.error('Add checklist item error:', error);
      toast.error('Não foi possível adicionar.'); 
    }
    finally { setAddingSubtask(false); }
  };

  // ---- Delete subtask ----
  const handleDeleteSubtask = async (subId: string) => {
    setDeletingId(subId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', subId);
      if (error) throw error;
      setSubtasks(prev => prev.filter(s => s.id !== subId));
      toast.success('Subtarefa removida.');
      onTaskUpdated?.();
    } catch (error) { 
      console.error('Remove checklist item error:', error);
      toast.error('Não foi possível remover.'); 
    }
    finally { setDeletingId(null); }
  };

  // ---- Delete entire task ----
  const handleDeleteTask = async () => {
    if (!taskData) return;
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa e todas as suas subtarefas? Esta ação não pode ser desfeita.')) return;
    
    setDeletingTask(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskData.id);
      if (error) throw error;
      toast.success('Tarefa excluída com sucesso!');
      onOpenChange(false);
      onTaskDeleted?.(taskData.id);
      onTaskUpdated?.();
    } catch (error) {
      console.error('Final task check error:', error);
      toast.error('Erro ao excluir a tarefa.');
    } finally {
      setDeletingTask(false);
    }
  };

  if (!taskData) return null;

  const completedSubs = subtasks.filter(s => s.status === 'done').length;
  const progressPct = subtasks.length > 0 ? Math.round((completedSubs / subtasks.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[740px] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-xl">

        {/* ── HEADER ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">

              {/* Status + Priority + Module badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <BadgeSelect
                  options={STATUS_OPTIONS}
                  value={taskData.status}
                  onSelect={v => updateTaskField('status', v)}
                  readOnly={readOnly}
                />
                <BadgeSelect
                  options={PRIORITY_OPTIONS}
                  value={taskData.priority}
                  onSelect={v => updateTaskField('priority', v)}
                  readOnly={readOnly}
                />
                <BadgeSelect
                  options={MODULE_OPTIONS}
                  value={taskData.module || 'general'}
                  onSelect={v => updateTaskField('module', v)}
                  readOnly={readOnly}
                />
              </div>

              {/* Editable title */}
              <InlineEdit
                value={taskData.title}
                onSave={v => updateTaskField('title', v)}
                placeholder="Título da tarefa..."
                className="text-lg font-bold text-slate-800 leading-tight"
                readOnly={readOnly}
              />

              {/* Editable description */}
              <div className="mt-2 text-sm text-slate-500 leading-relaxed">
                <InlineEdit
                  value={taskData.description || ''}
                  onSave={v => updateTaskField('description', v)}
                  multiline
                  placeholder="Adicione uma descrição..."
                  readOnly={readOnly}
                />
              </div>
            </div>

            {/* Close */}
            <Button variant="ghost" size="icon" className="shrink-0 -mt-0.5 -mr-1" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
            {taskData.clients?.name && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{taskData.clients.name}</span>
              </div>
            )}
            {taskData.profiles?.full_name && (
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{taskData.profiles.full_name}</span>
              </div>
            )}
            {taskData.due_date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{format(new Date(taskData.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 200px)' }}>

          {/* ─ SUBTAREFAS ─ */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Subtarefas</h3>
                {subtasks.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    {completedSubs}/{subtasks.length} · {progressPct}%
                  </span>
                )}
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowAddSubtask(v => !v)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              )}
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct === 100
                      ? 'linear-gradient(90deg,#22c55e,#10b981)'
                      : 'linear-gradient(90deg,#3b82f6,#6366f1)',
                  }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-0.5">
              {subtasks.map(sub => {
                const isDone = sub.status === 'done';
                const isToggling = togglingId === sub.id;
                const isDeleting = deletingId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={cn(
                      'flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-colors',
                      isDone ? 'opacity-60' : 'hover:bg-slate-50'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      className="shrink-0 focus:outline-none"
                      onClick={() => !readOnly && !isToggling && !isDeleting && handleToggle(sub.id, sub.status)}
                      disabled={readOnly || isToggling || isDeleting}
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                      )}
                    </button>

                    {/* Editable title */}
                    <div className="flex-1 min-w-0">
                      <InlineEdit
                        value={sub.title}
                        onSave={v => handleEditSubtaskTitle(sub.id, v)}
                        className={cn(isDone ? 'text-slate-400 line-through' : 'text-slate-700')}
                        readOnly={readOnly}
                      />
                    </div>

                    {/* Delete */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        disabled={isDeleting}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                        title="Remover subtarefa"
                      >
                        {isDeleting
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          : <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400 transition-colors" />
                        }
                      </button>
                    )}
                  </div>
                );
              })}

              {subtasks.length === 0 && !showAddSubtask && (
                <p className="text-xs text-slate-400 text-center py-3">
                  Nenhuma subtarefa. Clique em "Adicionar" para criar.
                </p>
              )}
            </div>

            {/* Add subtask input */}
            {showAddSubtask && (
              <div className="flex items-center gap-2 mt-2 pl-6">
                <Input
                  autoFocus
                  value={newSubTitle}
                  onChange={e => setNewSubTitle(e.target.value)}
                  placeholder="Título da subtarefa..."
                  className="h-8 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSubtask();
                    if (e.key === 'Escape') { setShowAddSubtask(false); setNewSubTitle(''); }
                  }}
                  disabled={addingSubtask}
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleAddSubtask}
                  disabled={!newSubTitle.trim() || addingSubtask}
                >
                  {addingSubtask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => { setShowAddSubtask(false); setNewSubTitle(''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ─ NOTAS / COMENTÁRIOS ─ */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">Notas & Comentários</h3>
              <span className="text-xs text-slate-400">({comments.length})</span>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-400">
                Nenhuma nota ainda. As notas são visíveis para o cliente.
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="bg-slate-50 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {c.author?.full_name || 'Equipe'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <Textarea
                placeholder={readOnly ? "Você não tem permissão para adicionar notas." : "Escreva uma nota ou atualização..."}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[72px] resize-none text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendComment();
                }}
                disabled={readOnly}
              />
              <Button
                size="icon"
                className="shrink-0 h-10 w-10"
                disabled={!newComment.trim() || sendingComment || readOnly}
                onClick={handleSendComment}
              >
                {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Ctrl+Enter para enviar • Visível para o cliente no Roadmap
            </p>
            {/* Delete entire task footer */}
            {!readOnly && (
              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTask}
                  disabled={deletingTask}
                  className="gap-2"
                >
                  {deletingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir Tarefa
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
