import type {
  PlannedTask,
  SolutionConfig,
  SolutionCondition,
  SolutionStructure,
} from '../types/solution.types';

/**
 * Núcleo puro do Engine de Soluções — sem dependência de Supabase/client,
 * para poder ser testado em Node diretamente.
 */

/** Converte 'YYYY-MM-DD' em Date UTC (evita desvios de fuso). */
function parseDateUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Formata Date UTC em 'YYYY-MM-DD'. */
function formatDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Soma dias corridos a uma data 'YYYY-MM-DD'. */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateUtc(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateUtc(date);
}

/** Convenção aprovada: day_offset = 1 => start_date. */
export function resolveDueDate(startDate: string, dayOffset: number): string {
  return addDays(startDate, dayOffset - 1);
}

/** Condição passa se for null (incondicional) ou todas as chaves forem true no config. */
export function evaluateCondition(
  condition: SolutionCondition | null | undefined,
  config: SolutionConfig,
): boolean {
  if (!condition) return true;
  const keys = Object.keys(condition);
  if (keys.length === 0) return true;
  return keys.every((k) => config[k] === true);
}

export function resolveEndDate(startDate: string, durationDays: number): string {
  return addDays(startDate, durationDays - 1);
}

/**
 * Expande a estrutura do template para a lista de tarefas planejadas,
 * respeitando conditions, recorrências e a convenção de dias corridos.
 * Recorrência: offsets start_offset + k*step_days <= end_offset, k >= 0.
 * template_key das recorrências: "{recur.key}@{offset}" (identidade estável).
 */
export function expandStructure(
  structure: SolutionStructure,
  config: SolutionConfig,
): PlannedTask[] {
  const planned: PlannedTask[] = [];

  for (const card of structure.cards) {
    if (!evaluateCondition(card.condition, config)) continue;

    for (const subtask of card.subtasks) {
      planned.push({
        template_key: subtask.key,
        title: subtask.title,
        description: subtask.description,
        module: card.module,
        priority: card.priority,
        milestone: card.milestone,
        day_offset: subtask.day_offset,
        duration_days: subtask.duration_days ?? 1,
        task_type: subtask.task_type,
        responsible_role: subtask.responsible_role,
        depends_on: subtask.depends_on ?? [],
      });
    }
  }

  for (const recurrence of structure.recurrences ?? []) {
    if (!evaluateCondition(recurrence.condition, config)) continue;

    for (
      let offset = recurrence.start_offset;
      offset <= recurrence.end_offset;
      offset += recurrence.step_days
    ) {
      planned.push({
        template_key: `${recurrence.key}@${offset}`,
        title: recurrence.title,
        module: recurrence.module,
        priority: recurrence.priority,
        milestone: null,
        day_offset: offset,
        duration_days: 1,
        task_type: recurrence.task_type,
        responsible_role: recurrence.responsible_role,
        depends_on: [],
      });
    }
  }

  return planned;
}