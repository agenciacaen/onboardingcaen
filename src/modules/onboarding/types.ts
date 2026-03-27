export interface FlowStep {
  step: number;
  title: string;
  description: string;
  order: number;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  flow_type: 'onboarding' | 'campaign' | 'delivery';
  steps: FlowStep[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface FlowProgress {
  id: string;
  flow_id: string;
  client_id: string;
  current_step: number;
  completed_steps: number[];
  completed_at?: string;
  updated_at: string;
}
