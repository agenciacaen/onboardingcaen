import { supabase } from './supabase';

export interface TemplateSubtaskDef {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  task_title: string;
  task_description?: string;
  module: string;
  priority: string;
  stage?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  subtasks: TemplateSubtaskDef[];
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

    const { data: subtasks, error: subsErr } = await supabase
      .from('project_template_subtasks')
      .select('*')
      .eq('template_id', id)
      .order('order_index');

    if (subsErr) throw subsErr;

    return { ...template, subtasks: subtasks || [] } as Template;
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    task_title: string;
    task_description?: string;
    module: string;
    priority: string;
    stage?: string;
    subtasks: { title: string; description?: string }[];
  }, userId: string) {
    const { data: template, error: tmplErr } = await supabase
      .from('project_templates')
      .insert({
        name: data.name,
        description: data.description || null,
        task_title: data.task_title,
        task_description: data.task_description || null,
        module: data.module,
        priority: data.priority,
        stage: data.stage || null,
        created_by: userId,
      })
      .select()
      .single();

    if (tmplErr) throw tmplErr;

    if (data.subtasks.length > 0) {
      const subs = data.subtasks.map((s, i) => ({
        template_id: template.id,
        title: s.title,
        description: s.description || null,
        order_index: i,
      }));

      const { error: subsErr } = await supabase.from('project_template_subtasks').insert(subs);
      if (subsErr) throw subsErr;
    }

    return { success: true };
  },

  async updateTemplate(id: string, data: {
    name: string;
    description?: string;
    task_title: string;
    task_description?: string;
    module: string;
    priority: string;
    stage?: string;
    subtasks: { title: string; description?: string }[];
  }) {
    const { error: tmplErr } = await supabase
      .from('project_templates')
      .update({
        name: data.name,
        description: data.description || null,
        task_title: data.task_title,
        task_description: data.task_description || null,
        module: data.module,
        priority: data.priority,
        stage: data.stage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (tmplErr) throw tmplErr;

    await supabase.from('project_template_subtasks').delete().eq('template_id', id);

    if (data.subtasks.length > 0) {
      const subs = data.subtasks.map((s, i) => ({
        template_id: id,
        title: s.title,
        description: s.description || null,
        order_index: i,
      }));

      const { error: subsErr } = await supabase.from('project_template_subtasks').insert(subs);
      if (subsErr) throw subsErr;
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

    const { data: parent, error: parentErr } = await supabase
      .from('tasks')
      .insert({
        client_id: clientId,
        title: template.task_title,
        description: template.task_description || '',
        module: template.module,
        status: 'todo',
        priority: template.priority,
        created_by: userId,
        stage: template.stage || null,
      })
      .select('id')
      .single();

    if (parentErr) throw parentErr;

    let tasksCreated = 1;

    if (template.subtasks && template.subtasks.length > 0) {
      const subs = template.subtasks.map((s, idx) => ({
        client_id: clientId,
        parent_id: parent.id,
        title: s.title,
        description: s.description || '',
        module: template.module,
        status: 'todo',
        priority: template.priority,
        created_by: userId,
        stage: template.stage || null,
        order: idx,
      }));

      const { error: subsErr } = await supabase.from('tasks').insert(subs);
      if (subsErr) throw subsErr;
      tasksCreated += subs.length;
    }

    return { tasksCreated };
  },
};
