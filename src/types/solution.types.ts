export type SolutionModule = 'traffic' | 'social' | 'web' | 'crm' | 'general';

export type SolutionTaskType =
  | 'deliverable'
  | 'internal'
  | 'automation'
  | 'monitoring'
  | 'meeting'
  | 'client';

export type SolutionResponsibleRole =
  | 'strategist'
  | 'sales_consultant'
  | 'crm'
  | 'social_media'
  | 'traffic'
  | 'developer'
  | 'designer'
  | 'ai'
  | 'client';

export type SolutionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SolutionCondition {
  needs_crm?: boolean;
  social_media?: boolean;
  meta_ads?: boolean;
  ia_sdr?: boolean;
  needs_lp?: boolean;
  needs_site?: boolean;
  google_ads?: boolean;
  commercial_team?: boolean;
  [key: string]: boolean | undefined;
}

export type SolutionConfig = Record<string, boolean>;

export interface SolutionMilestone {
  key: string;
  label: string;
  name: string;
  stage: string;
}

export interface SolutionSubtaskDef {
  key: string;
  title: string;
  day_offset: number;
  duration_days: number;
  task_type: SolutionTaskType;
  responsible_role: SolutionResponsibleRole;
  depends_on: string[];
  description?: string;
}

export interface SolutionCard {
  key: string;
  title: string;
  milestone: string;
  module: SolutionModule;
  priority: SolutionPriority;
  condition: SolutionCondition | null;
  day_offset?: number;
  duration_days?: number;
  subtasks: SolutionSubtaskDef[];
}

export type SolutionRecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface SolutionRecurrence {
  key: string;
  title: string;
  type: SolutionRecurrenceType;
  start_offset: number;
  end_offset: number;
  step_days: number;
  module: SolutionModule;
  priority: SolutionPriority;
  task_type: SolutionTaskType;
  responsible_role: SolutionResponsibleRole;
  condition: SolutionCondition | null;
}

export interface SolutionStructure {
  version: string;
  duration_days: number;
  milestones: SolutionMilestone[];
  cards: SolutionCard[];
  recurrences: SolutionRecurrence[];
}

export interface Solution {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  versions?: SolutionVersion[];
}

export interface SolutionVersion {
  id: string;
  solution_id: string;
  version: string;
  notes?: string;
  structure: SolutionStructure;
  is_current: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export type SolutionInstanceStatus = 'active' | 'paused' | 'completed' | 'removed';

export interface SolutionInstance {
  id: string;
  client_id: string;
  version_id: string;
  status: SolutionInstanceStatus;
  start_date: string;
  end_date?: string;
  config: SolutionConfig;
  linked_at: string;
  created_by?: string;
  updated_at?: string;
}

/**
 * Tarefa planejada pelo template (pronta para materialização).
 * template_key = chave estável e única por instância.
 */
export interface PlannedTask {
  template_key: string;
  title: string;
  description?: string;
  module: SolutionModule;
  priority: SolutionPriority;
  milestone: string | null;
  day_offset: number;
  duration_days: number;
  task_type: SolutionTaskType;
  responsible_role: SolutionResponsibleRole;
  depends_on: string[];
}

export interface InstantiateParams {
  clientId: string;
  versionId: string;
  startDate: string; // 'YYYY-MM-DD' — day_offset = 1 => startDate
  config: SolutionConfig;
  userId: string;
}

export interface InstantiateResult {
  instance: SolutionInstance;
  created: boolean;
  tasksCreated: number;
}

export interface MilestoneProgress {
  total: number;
  done: number;
}

export interface SolutionProgress {
  total: number;
  done: number;
  percent: number;
  byMilestone: Record<string, MilestoneProgress>;
}