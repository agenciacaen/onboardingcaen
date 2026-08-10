import type { SupabaseClient } from '@supabase/supabase-js';
import { expandStructure, resolveDueDate, resolveEndDate } from './solution.core.ts';
import type {
  InstantiateParams,
  InstantiateResult,
  MilestoneProgress,
  PlannedTask,
  Solution,
  SolutionInstance,
  SolutionInstanceStatus,
  SolutionProgress,
  SolutionStructure,
  SolutionVersion,
} from '../types/solution.types';

const PARALLEL_CHUNK = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Engine de Soluções — recebe o client Supabase (testável em Node).
 * Nunca apaga tarefas existentes; idempotente via instância/template_key.
 */
export function createSolutionEngine(client: SupabaseClient) {
  async function getVersion(versionId: string): Promise<SolutionVersion> {
    const { data, error } = await client
      .from('solution_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error || !data) throw error || new Error('Versão da solução não encontrada');
    return data as SolutionVersion;
  }

  async function getInstance(instanceId: string): Promise<SolutionInstance> {
    const { data, error } = await client
      .from('client_solutions')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (error || !data) throw error || new Error('Instância de solução não encontrada');
    return data as SolutionInstance;
  }

  function toTaskRow(
    planned: PlannedTask,
    clientId: string,
    instanceId: string,
    userId: string,
    startDate: string,
  ): Record<string, unknown> {
    return {
      client_id: clientId,
      title: planned.title,
      description: planned.description ?? null,
      module: planned.module,
      priority: planned.priority,
      status: 'todo',
      created_by: userId,
      due_date: resolveDueDate(startDate, planned.day_offset),
      day_offset: planned.day_offset,
      duration_days: planned.duration_days,
      milestone: planned.milestone,
      task_type: planned.task_type,
      responsible_role: planned.responsible_role,
      solution_instance_id: instanceId,
      template_key: planned.template_key,
      depends_on_task_ids: null,
    };
  }

  /** Segundo passe: template_key -> id da instância e grava depends_on_task_ids (sem enforcement). */
  async function resolveDependencies(
    plannedTasks: PlannedTask[],
    rows: { id: string; template_key: string }[],
  ): Promise<void> {
    const rowIdByKey = new Map(rows.map((r) => [r.template_key, r.id]));
    const missing: string[] = [];

    const pending: { rowId: string; ids: string[] }[] = [];

    for (const planned of plannedTasks) {
      if (planned.depends_on.length === 0) continue;
      const rowId = rowIdByKey.get(planned.template_key);
      if (!rowId) continue;

      const ids: string[] = [];
      for (const dep of planned.depends_on) {
        const id = rowIdByKey.get(dep);
        if (id) ids.push(id);
        else missing.push(dep);
      }
      if (ids.length > 0) pending.push({ rowId, ids });
    }

    if (missing.length > 0) {
      console.warn(
        `[solution-engine] dependências ignoradas (excluídas por condição): ${missing.join(', ')}`,
      );
    }

    for (const chunked of chunk(pending, PARALLEL_CHUNK)) {
      await Promise.all(
        chunked.map((p) =>
          client.from('tasks').update({ depends_on_task_ids: p.ids }).eq('id', p.rowId),
        ),
      );
    }
  }

  /**
   * Materializa uma solução para um cliente a partir da versão escolhida.
   * Idempotente: se a instância (status != removed) existir, retorna a existente.
   */
  async function instantiate(params: InstantiateParams): Promise<InstantiateResult> {
    const { clientId, versionId, startDate, config, userId } = params;

    const { data: existing } = await client
      .from('client_solutions')
      .select('id')
      .eq('client_id', clientId)
      .eq('version_id', versionId)
      .neq('status', 'removed')
      .maybeSingle();

    if (existing) {
      const { count } = await client
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('solution_instance_id', existing.id);
      return { instance: await getInstance(existing.id), created: false, tasksCreated: count ?? 0 };
    }

    const version = await getVersion(versionId);
    const structure = version.structure as SolutionStructure;
    const durationDays = structure.duration_days ?? 180;
    const planned = expandStructure(structure, config);

    const { data: instance, error: instanceError } = await client
      .from('client_solutions')
      .insert({
        client_id: clientId,
        version_id: versionId,
        status: 'active',
        start_date: startDate,
        end_date: resolveEndDate(startDate, durationDays),
        config,
        created_by: userId,
      })
      .select()
      .single();

    if (instanceError || !instance) {
      throw instanceError || new Error('Falha ao criar instância da solução');
    }

    if (planned.length === 0) {
      return { instance: instance as SolutionInstance, created: true, tasksCreated: 0 };
    }

    const { data: rows, error: insertError } = await client
      .from('tasks')
      .insert(planned.map((p) => toTaskRow(p, clientId, instance.id, userId, startDate)))
      .select('id, template_key');

    if (insertError || !rows) {
      throw insertError || new Error('Falha ao materializar tarefas da solução');
    }

    await resolveDependencies(planned, rows as { id: string; template_key: string }[]);

    return { instance: instance as SolutionInstance, created: true, tasksCreated: rows.length };
  }

  async function setStatus(instanceId: string, status: SolutionInstanceStatus): Promise<SolutionInstance> {
    const { data, error } = await client
      .from('client_solutions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', instanceId)
      .select()
      .single();
    if (error || !data) throw error || new Error('Falha ao atualizar status da instância');
    return data as SolutionInstance;
  }

  function pause(instanceId: string): Promise<SolutionInstance> {
    return setStatus(instanceId, 'paused');
  }

  function resume(instanceId: string): Promise<SolutionInstance> {
    return setStatus(instanceId, 'active');
  }

  /** Remove a instância preservando histórico (tasks permanecem). */
  function remove(instanceId: string): Promise<SolutionInstance> {
    return setStatus(instanceId, 'removed');
  }

  /**
   * Reagenda a instância para newStartDate: recalcula due_date
   * (newStart + day_offset − 1) apenas para tasks não concluídas.
   */
  async function reschedule(instanceId: string, newStartDate: string): Promise<SolutionInstance> {
    const instance = await getInstance(instanceId);

    const { data: tasks, error: tasksError } = await client
      .from('tasks')
      .select('id, status, day_offset')
      .eq('solution_instance_id', instanceId);
    if (tasksError) throw tasksError;

    const byOffset = new Map<number, string[]>();
    for (const task of tasks ?? []) {
      if (task.status === 'done') continue;
      const offset = task.day_offset ?? 1;
      const ids = byOffset.get(offset) ?? [];
      ids.push(task.id);
      byOffset.set(offset, ids);
    }

    const updates = Array.from(byOffset.entries()).map(
      ([offset, ids]) =>
        client
          .from('tasks')
          .update({ due_date: resolveDueDate(newStartDate, offset) })
          .in('id', ids),
    );

    for (const chunked of chunk(updates, PARALLEL_CHUNK)) {
      await Promise.all(chunked);
    }

    const version = await getVersion(instance.version_id);
    const durationDays = (version.structure as SolutionStructure).duration_days ?? 180;

    const { data, error } = await client
      .from('client_solutions')
      .update({
        start_date: newStartDate,
        end_date: resolveEndDate(newStartDate, durationDays),
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao reagendar instância');
    return data as SolutionInstance;
  }

  async function getProgress(instanceId: string): Promise<SolutionProgress> {
    const instance = await getInstance(instanceId);
    const version = await getVersion(instance.version_id);
    const milestones = (version.structure as SolutionStructure).milestones ?? [];

    const { data: tasks, error } = await client
      .from('tasks')
      .select('id, status, milestone')
      .eq('solution_instance_id', instanceId);
    if (error) throw error;

    const all = tasks ?? [];
    const done = all.filter((t) => t.status === 'done').length;
    const byMilestone: Record<string, MilestoneProgress> = {};

    for (const milestone of milestones) {
      const ofMilestone = all.filter((t) => t.milestone === milestone.key);
      byMilestone[milestone.key] = {
        total: ofMilestone.length,
        done: ofMilestone.filter((t) => t.status === 'done').length,
      };
    }

    const total = all.length;
    return {
      total,
      done,
      percent: total === 0 ? 0 : Math.round((done / total) * 1000) / 10,
      byMilestone,
    };
  }

  async function listSolutions(): Promise<Solution[]> {
    const { data, error } = await client
      .from('solutions')
      .select('*, solution_versions(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Solution[];
  }

  async function listClientInstances(clientId: string): Promise<SolutionInstance[]> {
    const { data, error } = await client
      .from('client_solutions')
      .select('*')
      .eq('client_id', clientId)
      .order('linked_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SolutionInstance[];
  }

  return {
    instantiate,
    pause,
    resume,
    remove,
    reschedule,
    getProgress,
    getVersion,
    getInstance,
    listSolutions,
    listClientInstances,
  };
}

export type SolutionEngine = ReturnType<typeof createSolutionEngine>;