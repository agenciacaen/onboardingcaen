import { supabase } from './supabase';

export interface TemplateSubtaskDef {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

export interface TemplateTaskDef {
  id: string;
  title: string;
  description?: string;
  module: string;
  priority: string;
  stage?: string;
  order_index: number;
  subtasks: TemplateSubtaskDef[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  tasks: TemplateTaskDef[];
}

export const TemplateService = {
  async listTemplates() {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Template[];
  },

  async getTemplate(id: string) {
    const { data: template, error: tmplErr } = await supabase
      .from('project_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (tmplErr || !template) throw tmplErr || new Error('Template não encontrado');

    const { data: tasks, error: tasksErr } = await supabase
      .from('project_template_tasks')
      .select('*')
      .eq('template_id', id)
      .order('order_index');

    if (tasksErr) throw tasksErr;

    const taskIds = (tasks || []).map(t => t.id);
    let subtasks: any[] = [];
    if (taskIds.length > 0) {
      const { data: subs, error: subsErr } = await supabase
        .from('project_template_subtasks')
        .select('*')
        .in('template_task_id', taskIds)
        .order('order_index');

      if (subsErr) throw subsErr;
      subtasks = subs || [];
    }

    const tasksWithSubtasks = (tasks || []).map(t => ({
      ...t,
      subtasks: subtasks.filter(s => s.template_task_id === t.id),
    }));

    return { ...template, tasks: tasksWithSubtasks } as Template;
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    tasks: {
      title: string;
      description?: string;
      module: string;
      priority: string;
      stage?: string;
      subtasks: { title: string; description?: string }[];
    }[];
  }, userId: string) {
    const { data: template, error: tmplErr } = await supabase
      .from('project_templates')
      .insert({ name: data.name, description: data.description, created_by: userId })
      .select()
      .single();

    if (tmplErr) throw tmplErr;

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      const { data: taskData, error: taskErr } = await supabase
        .from('project_template_tasks')
        .insert({
          template_id: template.id,
          title: task.title,
          description: task.description,
          module: task.module,
          priority: task.priority,
          stage: task.stage || null,
          order_index: i,
        })
        .select()
        .single();

      if (taskErr) throw taskErr;

      if (task.subtasks.length > 0) {
        const subs = task.subtasks.map((s, si) => ({
          template_task_id: taskData.id,
          title: s.title,
          description: s.description || null,
          order_index: si,
        }));

        const { error: subsErr } = await supabase.from('project_template_subtasks').insert(subs);
        if (subsErr) throw subsErr;
      }
    }

    return { success: true };
  },

  async updateTemplate(id: string, data: {
    name: string;
    description?: string;
    tasks: {
      title: string;
      description?: string;
      module: string;
      priority: string;
      stage?: string;
      subtasks: { title: string; description?: string }[];
    }[];
  }) {
    const { error: tmplErr } = await supabase
      .from('project_templates')
      .update({ name: data.name, description: data.description, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (tmplErr) throw tmplErr;

    const { data: existingTasks } = await supabase
      .from('project_template_tasks')
      .select('id')
      .eq('template_id', id);

    const oldTaskIds = (existingTasks || []).map(t => t.id);
    if (oldTaskIds.length > 0) {
      await supabase.from('project_template_subtasks').delete().in('template_task_id', oldTaskIds);
      await supabase.from('project_template_tasks').delete().eq('template_id', id);
    }

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      const { data: taskData, error: taskErr } = await supabase
        .from('project_template_tasks')
        .insert({
          template_id: id,
          title: task.title,
          description: task.description,
          module: task.module,
          priority: task.priority,
          stage: task.stage || null,
          order_index: i,
        })
        .select()
        .single();

      if (taskErr) throw taskErr;

      if (task.subtasks.length > 0) {
        const subs = task.subtasks.map((s, si) => ({
          template_task_id: taskData.id,
          title: s.title,
          description: s.description || null,
          order_index: si,
        }));

        const { error: subsErr } = await supabase.from('project_template_subtasks').insert(subs);
        if (subsErr) throw subsErr;
      }
    }

    return { success: true };
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase.from('project_templates').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async applyTemplate(templateId: string, clientId: string, userId: string) {
    const template = await this.getTemplate(templateId);
    let tasksCreated = 0;

    for (const task of template.tasks) {
      const { data: parent, error: parentErr } = await supabase
        .from('tasks')
        .insert({
          client_id: clientId,
          title: task.title,
          description: task.description || '',
          module: task.module,
          status: 'todo',
          priority: task.priority,
          created_by: userId,
          stage: task.stage || null,
        })
        .select('id')
        .single();

      if (parentErr) throw parentErr;
      tasksCreated++;

      if (task.subtasks && task.subtasks.length > 0) {
        const subs = task.subtasks.map((s, idx) => ({
          client_id: clientId,
          parent_id: parent.id,
          title: s.title,
          description: s.description || '',
          module: task.module,
          status: 'todo',
          priority: task.priority,
          created_by: userId,
          stage: task.stage || null,
          order: idx,
        }));

        const { error: subsErr } = await supabase.from('tasks').insert(subs);
        if (subsErr) throw subsErr;
        tasksCreated += subs.length;
      }
    }

    return { tasksCreated };
  },
};
