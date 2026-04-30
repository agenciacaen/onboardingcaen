import { supabase } from './supabase';
import { NotificationService } from './notification.service';


export interface OnboardingTemplate {
  title: string;
  description?: string;
  module: 'traffic' | 'social' | 'web' | 'general';
  subtasks?: { title: string; description?: string }[];
}

const PHASE_1_TEMPLATE: OnboardingTemplate[] = [
  {
    title: 'Análise e Estrutura de Redes Sociais',
    description: 'Padronização e análise da estrutura visual e informativa das redes sociais.',
    module: 'social',
    subtasks: [
      { title: 'Foto de Perfil', description: 'Verificação de qualidade e alinhamento de marca.' },
      { title: 'Biografia', description: 'Revisão da Bio para conversão e clareza.' },
      { title: 'Destaques', description: 'Organização dos destaques estratégicos.' },
      { title: 'Feed', description: 'Avaliação do padrão visual das postagens.' },
    ]
  },
  {
    title: 'Implementação CMM (CRM & Marketing)',
    description: 'Configuração completa do ecossistema de atendimento e vendas.',
    module: 'general',
    subtasks: [
      { title: 'Fluxo de Cadência', description: 'Definição da frequência de contatos.' },
      { title: 'Funil de Vendas', description: 'Configuração das etapas comerciais.' },
      { title: 'Inteligência Artificial', description: 'Implementação da IA de atendimento.' },
      { title: 'Automações', description: 'Configuração de gatilhos automáticos.' },
      { title: 'Estágios da Pipeline', description: 'Organização visual do funil no sistema.' },
    ]
  },
  {
    title: 'Campanha Meta para WhatsApp',
    description: 'Preparação técnica e criativa para anúncios voltados para conversão.',
    module: 'traffic',
    subtasks: [
      { title: 'Criação da Campanha', description: 'Criação da campanha no Gerenciador de Anúncios.' },
      { title: 'Anúncios (Criativos e Copy)', description: 'Identity visual e textos persuasivos.' },
      { title: 'Conteúdo Redes Sociais', description: 'Gravação, edição e aprovação de materiais.' },
    ]
  }
];

const PHASE_2_TEMPLATE: OnboardingTemplate[] = [
  {
    title: 'Escalabilidade e Otimização',
    description: 'Expansão dos resultados obtidos na fase de setup.',
    module: 'traffic',
    subtasks: [
      { title: 'Análise de Métricas', description: 'Revisão detalhada do ROAS e CPA.' },
      { title: 'Novos Públicos', description: 'Criação de Lookalike e públicos personalizados.' },
      { title: 'Escala de Investimento', description: 'Aumento de verba estratégico.' },
    ]
  }
];

export const AutomationService = {
  /**
   * Inicializa o onboarding Fase 1 para um cliente
   */
  async initializeOnboarding(clientId: string, userId: string) {
    try {
      console.log('Iniciando Onboarding Fase 1...');
      
      // 1. Limpa tarefas do cliente que sejam de onboarding_phase1 para evitar duplicadas
      await supabase
        .from('tasks')
        .delete()
        .eq('client_id', clientId)
        .eq('stage', 'onboarding_phase_1');

      // 2. Aplica template
      for (const template of PHASE_1_TEMPLATE) {
        // Criar tarefa pai
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .insert({
            client_id: clientId,
            title: template.title,
            description: template.description || '',
            module: template.module,
            status: 'todo',
            priority: 'medium',
            created_by: userId,
            stage: 'onboarding_phase_1',
          })
          .select()
          .single();

        if (parentError) throw parentError;

        // Criar subtarefas
        if (template.subtasks) {
          const subtasks = template.subtasks.map(s => ({
            client_id: clientId,
            parent_id: parentTask.id,
            title: s.title,
            description: s.description || '',
            module: template.module,
            status: 'todo',
            priority: 'medium',
            created_by: userId,
            stage: 'onboarding_phase_1',
          }));

          const { error: subError } = await supabase.from('tasks').insert(subtasks);
          if (subError) throw subError;
        }
      }

      // 3. Atualiza o status do cliente
      await supabase
        .from('clients')
        .update({ status: 'onboarding', onboarding_completed: false })
        .eq('id', clientId);

      // 4. Notificar o cliente
      await NotificationService.createNotification({
        clientId,
        type: 'task',
        title: 'Novas Tarefas de Onboarding',
        body: 'O onboarding da Fase 1 foi inicializado. Confira suas primeiras atividades!',
        link: '/client/onboarding'
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao inicializar onboarding:', error);
      throw error;
    }
  },

  /**
   * Gera a Fase 2 do projeto
   */
  async generatePhase2(clientId: string, userId: string) {
    try {
      for (const template of PHASE_2_TEMPLATE) {
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .insert({
            client_id: clientId,
            title: template.title,
            description: template.description || '',
            module: template.module,
            status: 'todo',
            priority: 'medium',
            created_by: userId,
            stage: 'onboarding_phase_2',
          })
          .select()
          .single();

        if (parentError) throw parentError;

        if (template.subtasks) {
          const subtasks = template.subtasks.map(s => ({
            client_id: clientId,
            parent_id: parentTask.id,
            title: s.title,
            description: s.description || '',
            module: template.module,
            status: 'todo',
            priority: 'medium',
            created_by: userId,
            stage: 'onboarding_phase_2',
          }));

          const { error: subError } = await supabase.from('tasks').insert(subtasks);
          if (subError) throw subError;
        }
      }
      // Notificar o cliente
      await NotificationService.createNotification({
        clientId,
        type: 'task',
        title: 'Novas Tarefas da Fase 2',
        body: 'A Fase 2 do seu projeto foi gerada. Veja as novas atividades planejadas!',
        link: '/client/onboarding'
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao gerar Fase 2:', error);
      throw error;
    }
  },

  /**
   * Executa um fluxo personalizado para um cliente (ou apenas um passo específico).
   */
  async executeFlow(
    flowId: string, 
    clientId: string, 
    userId: string, 
    stepId?: string
  ): Promise<{ tasksCreated: number }> {
    // 1. Buscar o fluxo
    const { data: flow, error: flowErr } = await supabase
      .from('flows')
      .select('*')
      .eq('id', flowId)
      .single();
    
    if (flowErr || !flow) throw new Error('Fluxo não encontrado.');

    const steps = (flow.steps as any[]) || [];
    
    // 2. Filtrar os steps que vamos processar
    // Se stepId for passado, filtramos apenas aquele step.
    // Caso contrário, pegamos todos os steps do tipo 'action' (ou sem tipo definido, para compatibilidade).
    const actionSteps = steps.filter(s => {
      // Se tiver stepId, bate o ID
      if (stepId) return s.id === stepId;
      // Se não tiver stepId, pega todos que NÃO são trigger (ou seja, são ações)
      return s.type !== 'trigger';
    });

    if (actionSteps.length === 0) return { tasksCreated: 0 };

    let tasksCreated = 0;

    for (const step of actionSteps) {
      const stage = step.stage || 'custom';
      const module = step.module || 'general';
      const priority = step.priority || 'medium';
      const title = step.description || step.title || 'Tarefa de Fluxo';
      const subtaskDefs = (step.subtasks as Array<{ title: string }>) || [];

      // Apagar tasks existentes do mesmo stage e mesmo título para esse cliente (evitar duplicatas exatas)
      await supabase
        .from('tasks')
        .delete()
        .eq('client_id', clientId)
        .eq('stage', stage)
        .eq('title', title)
        .is('parent_id', null);

      // Criar tarefa pai
      const { data: parent, error: parentErr } = await supabase
        .from('tasks')
        .insert({
          client_id: clientId,
          title,
          module,
          status: 'todo',
          priority,
          created_by: userId,
          stage,
          is_template: false,
        })
        .select('id')
        .single();

      if (parentErr) {
        console.error('Erro ao criar a tarefa pai do fluxo:', parentErr);
        throw parentErr;
      }

      tasksCreated++;

      // Criar subtarefas
      if (subtaskDefs.length > 0) {
        const subs = subtaskDefs
          .filter(s => s.title.trim() !== '') // Evitar subtarefas vazias
          .map((s, idx) => ({
            client_id: clientId,
            parent_id: parent.id,
            title: s.title,
            module,
            status: 'todo',
            priority,
            created_by: userId,
            stage,
            order: idx,
            is_template: false,
          }));

        if (subs.length > 0) {
          const { error: subErr } = await supabase.from('tasks').insert(subs);
          if (subErr) {
            console.error('Erro ao criar subtarefas:', subErr);
            throw subErr;
          }
          tasksCreated += subs.length;
        }
      }
    }
    
    // Notificar o cliente se tarefas foram criadas
    if (tasksCreated > 0) {
      await NotificationService.createNotification({
        clientId,
        type: 'task',
        title: 'Fluxo de Atividades Atualizado',
        body: `Novas tarefas foram preparadas para você. Confira os detalhes!`,
        link: '/client/onboarding'
      });
    }

    return { tasksCreated };
  },

  /**
   * Cria uma tarefa de ajuste a partir de uma reprovação de arte/criativo
   */
  async createTaskFromRejection(clientId: string, userId: string, creativeData: { title: string, feedback: string }) {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          client_id: clientId,
          title: `[Ajuste] - ${creativeData.title}`,
          description: `Feedback do Cliente: ${creativeData.feedback}`,
          module: 'social',
          status: 'todo',
          priority: 'high',
          created_by: userId,
          stage: 'production_fix',
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar tarefa de ajuste:', error);
      throw error;
    }
  },

  /**
   * Converte um ticket de suporte em uma tarefa de produção
   */
  async createTaskFromTicket(clientId: string, userId: string, ticketData: { id: string, subject: string, description?: string }) {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          client_id: clientId,
          title: `[Suporte] - ${ticketData.subject}`,
          description: `Ticket ID: #${ticketData.id.split('-')[0]}\n\nDescrição: ${ticketData.description || 'Ver no ticket'}`,
          module: 'general',
          status: 'todo',
          priority: 'medium',
          created_by: userId,
          stage: 'support_task',
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao converter ticket em tarefa:', error);
      throw error;
    }
  },
};
