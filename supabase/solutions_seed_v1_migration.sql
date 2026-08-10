-- ============================================================
-- MIGRATION B — Seed da "Solução Comercial em 6 Meses" v1.0
-- Conteúdo 100% conforme especificação aprovada (Plano Final v2)
-- 62 cards (frentes) + 4 recorrências, dias 1–180
-- ============================================================

insert into public.solutions (name, description, icon, is_active, created_by)
select
  'Solução Comercial em 6 Meses',
  'Metodologia completa de implantação comercial e marketing para construtoras e incorporadoras — 180 dias, 6 meses, 6 marcos.',
  'layers',
  true,
  id
from public.profiles
where role = 'admin'
order by created_at
limit 1;

insert into public.solution_versions (solution_id, version, notes, is_current, created_by, structure)
select
  s.id,
  'v1.0',
  'Versão inicial da metodologia (Plano Final v2).',
  true,
  s.created_by,
  '{
    "version": "v1.0",
    "duration_days": 180,
    "milestones": [
      { "key": "m1", "label": "M1 — OPERAÇÃO ATIVADA", "name": "Ativação", "stage": "solution_month_1" },
      { "key": "m2", "label": "M2 — INFRAESTRUTURA CONSTRUÍDA", "name": "Construção", "stage": "solution_month_2" },
      { "key": "m3", "label": "M3 — DADOS SUFICIENTES PARA APRENDER", "name": "Aprendizado", "stage": "solution_month_3" },
      { "key": "m4", "label": "M4 — OPERAÇÃO OTIMIZADA", "name": "Otimização", "stage": "solution_month_4" },
      { "key": "m5", "label": "M5 — ESCALA", "name": "Escala", "stage": "solution_month_5" },
      { "key": "m6", "label": "M6 — OPERAÇÃO CONSOLIDADA", "name": "Consolidação", "stage": "solution_month_6" }
    ],
    "cards": [
      {
        "key": "m1.diagnostico", "title": "Diagnóstico", "milestone": "m1", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m1.diagnostico.entrega", "title": "Oferta prioritária + ICP + gargalos", "day_offset": 1, "duration_days": 1, "task_type": "deliverable", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m1.process", "title": "Processo comercial", "milestone": "m1", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m1.process.process_commercial", "title": "Funil + MQL/SQL + qualificação + cadência", "day_offset": 2, "duration_days": 1, "task_type": "deliverable", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m1.crm", "title": "CRM + IA", "milestone": "m1", "module": "general", "priority": "high", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m1.crm.crm_ia_setup", "title": "Pipeline + campos + regras + estrutura para IA", "day_offset": 3, "duration_days": 1, "task_type": "deliverable", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m1.social", "title": "Redes sociais", "milestone": "m1", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m1.social.preparacao", "title": "Instagram/Facebook preparados para receber tráfego", "day_offset": 4, "duration_days": 1, "task_type": "internal", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m1.traffic", "title": "Meta Ads — Campanha 01", "milestone": "m1", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m1.traffic.meta_campaign_01", "title": "Primeira campanha no ar", "day_offset": 5, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": ["m1.process.process_commercial", "m1.crm.crm_ia_setup"] }
        ]
      },
      {
        "key": "m1.leads", "title": "Tráfego + CRM", "milestone": "m1", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m1.leads.primeiros_leads", "title": "Primeiros leads entrando no CRM", "day_offset": 6, "duration_days": 1, "task_type": "monitoring", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m1.ia_comercial", "title": "IA + Comercial", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "ia_sdr": true },
        "subtasks": [
          { "key": "m1.ia_comercial.ia_assistida", "title": "IA assistida + primeiros critérios de qualificação", "day_offset": 7, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] }
        ]
      },
      {
        "key": "m1.social_media", "title": "Social Media", "milestone": "m1", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m1.social_media.editorial", "title": "Linha editorial + pilares de conteúdo", "day_offset": 8, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m1.social_media.calendario", "title": "Calendário + roteiros", "day_offset": 9, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m1.social_media.producao", "title": "Primeira produção de conteúdo", "day_offset": 10, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m1.ia_sdr", "title": "IA SDR", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "ia_sdr": true },
        "subtasks": [
          { "key": "m1.ia_sdr.pre_qualificacao", "title": "Pré-qualificação inicial dos leads", "day_offset": 11, "duration_days": 1, "task_type": "automation", "responsible_role": "ai", "depends_on": [] }
        ]
      },
      {
        "key": "m1.ia_crm", "title": "IA + CRM", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m1.ia_crm.cadencia", "title": "Primeira cadência automatizada", "day_offset": 12, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m1.landing", "title": "Landing Page", "milestone": "m1", "module": "web", "priority": "high", "condition": { "needs_lp": true },
        "day_offset": 13, "duration_days": 4,
        "subtasks": [
          { "key": "m1.landing.arquitetura", "title": "Arquitetura + oferta + copy", "day_offset": 13, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] },
          { "key": "m1.landing.design", "title": "Design + desenvolvimento", "day_offset": 14, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] },
          { "key": "m1.landing.formulario", "title": "Formulário + WhatsApp + CRM", "day_offset": 15, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m1.landing.page", "title": "Tracking + QA + publicação", "day_offset": 16, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] }
        ]
      },
      {
        "key": "m1.rota2", "title": "Tráfego — Rota 2", "milestone": "m1", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m1.traffic.route_lp_crm", "title": "Segunda rota: Meta > LP > CRM", "day_offset": 17, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": ["m1.landing.page"] }
        ]
      },
      {
        "key": "m1.crm_pipeline", "title": "CRM — Automações", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m1.crm.pipeline", "title": "Automação de pipeline", "day_offset": 18, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m1.comercial", "title": "Comercial", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "commercial_team": true },
        "subtasks": [
          { "key": "m1.comercial.scripts", "title": "Ajuste de scripts + abordagem", "day_offset": 19, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m1.ia_sdr2", "title": "IA SDR — Follow-up", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "ia_sdr": true },
        "subtasks": [
          { "key": "m1.ia_sdr.followup", "title": "Follow-up automático inicial", "day_offset": 20, "duration_days": 1, "task_type": "automation", "responsible_role": "ai", "depends_on": [] }
        ]
      },
      {
        "key": "m1.social_round2", "title": "Social — Rodada 2", "milestone": "m1", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m1.social_media.analise", "title": "Análise dos primeiros conteúdos", "day_offset": 21, "duration_days": 1, "task_type": "internal", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m1.social_media.roteiros2", "title": "Nova rodada de roteiros", "day_offset": 22, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m1.social_media.producao2", "title": "Produção + edição", "day_offset": 23, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m1.social_media.publicacao", "title": "Publicação + interação", "day_offset": 24, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m1.traffic_opt", "title": "Tráfego — Otimização", "milestone": "m1", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m1.traffic.otim_publico", "title": "Otimização de público", "day_offset": 25, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m1.traffic.otim_criativos", "title": "Otimização de criativos/copy", "day_offset": 26, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m1.crm_ia_analise", "title": "CRM + IA — Análise", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m1.crm.qualificacao_auto", "title": "Análise da qualificação automática", "day_offset": 27, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m1.comercial2", "title": "Comercial — Análise", "milestone": "m1", "module": "general", "priority": "medium", "condition": { "commercial_team": true },
        "subtasks": [
          { "key": "m1.comercial.analise_leads", "title": "Análise lead > contato > oportunidade", "day_offset": 28, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m1.traffic_rodada", "title": "Tráfego — Rodada 3", "milestone": "m1", "module": "traffic", "priority": "medium", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m1.traffic.novos_criativos", "title": "Nova rodada de criativos", "day_offset": 29, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m1.gestao", "title": "Gestão", "milestone": "m1", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m1.gestao.fechamento", "title": "Fechamento do Mês 01", "day_offset": 30, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m2.dados", "title": "Análise de dados", "milestone": "m2", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m2.dados.resultados_m1", "title": "Resultados do Mês 1", "day_offset": 31, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m2.dados.campanha_vencedora", "title": "Campanha vencedora / padrões iniciais", "day_offset": 32, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m2.dados.otimizacoes", "title": "Otimizações definidas para o Mês 2", "day_offset": 33, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m2.website", "title": "Site institucional", "milestone": "m2", "module": "web", "priority": "high", "condition": { "needs_site": true },
        "day_offset": 34, "duration_days": 11,
        "subtasks": [
          { "key": "m2.website.arquitetura", "title": "Arquitetura + copy do site", "day_offset": 34, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": ["m1.traffic.route_lp_crm"] },
          { "key": "m2.website.design", "title": "Design do site", "day_offset": 35, "duration_days": 1, "task_type": "deliverable", "responsible_role": "designer", "depends_on": [] },
          { "key": "m2.website.dev", "title": "Desenvolvimento + responsividade", "day_offset": 36, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] },
          { "key": "m2.website.formularios", "title": "Formulários + WhatsApp", "day_offset": 37, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m2.website.crm_tracking", "title": "Integração CRM + tracking", "day_offset": 38, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m2.website.performance", "title": "Performance", "day_offset": 39, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m2.website.qa", "title": "QA", "day_offset": 40, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m2.website.institutional", "title": "Publicação do site", "day_offset": 41, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] }
        ]
      },
      {
        "key": "m2.google", "title": "Google Ads", "milestone": "m2", "module": "traffic", "priority": "high", "condition": { "google_ads": true },
        "subtasks": [
          { "key": "m2.google.diagnostico", "title": "Diagnóstico da conta Google Ads", "day_offset": 45, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m2.google.estrutura", "title": "Estrutura da campanha Search", "day_offset": 46, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m2.google.no_ar", "title": "Campanha no ar + tracking", "day_offset": 47, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m2.crm", "title": "CRM + IA", "milestone": "m2", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m2.crm.analise_leads", "title": "Análise de leads do mês", "day_offset": 48, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] },
          { "key": "m2.crm.criterios", "title": "Ajuste de critérios de qualificação", "day_offset": 49, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] },
          { "key": "m2.crm.automacoes", "title": "Automações de cadência avançadas", "day_offset": 50, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m2.traffic", "title": "Tráfego", "milestone": "m2", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m2.traffic.otim_meta", "title": "Otimização Meta Ads (M1)", "day_offset": 51, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m2.traffic.criativos2", "title": "Criativos rodada 2", "day_offset": 52, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m2.traffic.analise_opp", "title": "Análise lead → oportunidade", "day_offset": 53, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m2.social", "title": "Social", "milestone": "m2", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m2.social.pilares", "title": "Novos pilares de conteúdo", "day_offset": 54, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m2.social.calendario", "title": "Calendário M2", "day_offset": 55, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m2.social.producao", "title": "Produção M2", "day_offset": 56, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m2.social.publicacao", "title": "Publicação + interação", "day_offset": 57, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m2.comercial", "title": "Comercial", "milestone": "m2", "module": "general", "priority": "medium", "condition": { "commercial_team": true },
        "subtasks": [
          { "key": "m2.comercial.followups", "title": "Revisão de follow-ups", "day_offset": 58, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m2.comercial.objecoes", "title": "Ajuste de objeções", "day_offset": 59, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m2.gestao", "title": "Gestão", "milestone": "m2", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m2.gestao.fechamento", "title": "Fechamento Mês 02", "day_offset": 60, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m3.auditoria", "title": "Auditoria 60 dias", "milestone": "m3", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m3.auditoria.geral", "title": "Auditoria dos primeiros 60 dias", "day_offset": 61, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m3.auditoria.campanhas", "title": "Análise campanhas/públicos/criativos", "day_offset": 62, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.auditoria.funil", "title": "Análise MQL > SQL > oportunidade > venda", "day_offset": 63, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m3.auditoria.funil_audit", "title": "Auditoria do funil de vendas", "day_offset": 64, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m3.qualificacao", "title": "Qualificação IA", "milestone": "m3", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m3.qualificacao.audit", "title": "Auditoria da qualificação automática", "day_offset": 65, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] },
          { "key": "m3.qualificacao.ajuste", "title": "Ajuste de critérios", "day_offset": 66, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m3.testes", "title": "Testes", "milestone": "m3", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m3.testes.criativos", "title": "Novos criativos", "day_offset": 67, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.testes.angulos", "title": "Novos ângulos", "day_offset": 68, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.testes.publicos", "title": "Novos públicos", "day_offset": 69, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.testes.ctas", "title": "Novos CTAs", "day_offset": 70, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.testes.ab", "title": "Rodadas A/B", "day_offset": 71, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.testes.leitura", "title": "Leitura de resultados", "day_offset": 72, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m3.landing", "title": "Landing Page", "milestone": "m3", "module": "web", "priority": "medium", "condition": { "needs_lp": true },
        "subtasks": [
          { "key": "m3.landing.conversao", "title": "Análise de conversão da LP", "day_offset": 73, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m3.landing.testes", "title": "Testes de copy/oferta", "day_offset": 74, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] },
          { "key": "m3.landing.ajustes", "title": "Ajustes publicados", "day_offset": 75, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] }
        ]
      },
      {
        "key": "m3.remarketing", "title": "Remarketing", "milestone": "m3", "module": "traffic", "priority": "medium", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m3.remarketing.setup", "title": "Setup de remarketing", "day_offset": 76, "duration_days": 1, "task_type": "automation", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m3.remarketing.criativos", "title": "Criativos de remarketing", "day_offset": 77, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m3.social", "title": "Social", "milestone": "m3", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m3.social.engajamento", "title": "Análise de engajamento", "day_offset": 78, "duration_days": 1, "task_type": "internal", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m3.social.calendario", "title": "Calendário M3", "day_offset": 79, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m3.social.producao", "title": "Produção", "day_offset": 80, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m3.social.publicacao", "title": "Publicação", "day_offset": 81, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m3.comercial", "title": "Comercial", "milestone": "m3", "module": "general", "priority": "medium", "condition": { "commercial_team": true },
        "subtasks": [
          { "key": "m3.comercial.atendimento", "title": "Auditoria de atendimento", "day_offset": 82, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m3.comercial.scripts2", "title": "Scripts v2", "day_offset": 83, "duration_days": 1, "task_type": "deliverable", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m3.comercial.followup", "title": "Follow-up", "day_offset": 84, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m3.comercial.objecoes", "title": "Objeções", "day_offset": 85, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m3.gestao", "title": "Gestão", "milestone": "m3", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m3.gestao.trimestral", "title": "Reunião trimestral", "day_offset": 86, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m3.gestao.metas", "title": "Revisão de metas", "day_offset": 87, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m3.gestao.fechamento", "title": "Fechamento Mês 03", "day_offset": 90, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m4.gargalos", "title": "Diagnóstico de gargalos", "milestone": "m4", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m4.gargalos.identificar", "title": "Identificação do gargalo principal", "day_offset": 91, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.gargalos.plano", "title": "Plano de ataque", "day_offset": 92, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.gargalos.rotas", "title": "Ajuste de rotas", "day_offset": 93, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m4.otimizacao", "title": "Otimização de campanhas", "milestone": "m4", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m4.otimizacao.campanha", "title": "Campanha/público/criativo", "day_offset": 94, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m4.otimizacao.lp", "title": "Conversão LP", "day_offset": 95, "duration_days": 1, "task_type": "internal", "responsible_role": "developer", "depends_on": [] },
          { "key": "m4.otimizacao.remarketing", "title": "Remarketing reforçado", "day_offset": 96, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m4.otimizacao.roda", "title": "Nova rodada de testes", "day_offset": 97, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m4.comercial", "title": "Auditoria comercial", "milestone": "m4", "module": "general", "priority": "high", "condition": { "commercial_team": true },
        "subtasks": [
          { "key": "m4.comercial.resposta", "title": "Tempo de resposta", "day_offset": 98, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m4.comercial.scripts", "title": "Scripts", "day_offset": 99, "duration_days": 1, "task_type": "deliverable", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m4.comercial.followup", "title": "Follow-up", "day_offset": 100, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m4.comercial.objecoes", "title": "Objeções", "day_offset": 101, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] }
        ]
      },
      {
        "key": "m4.crm", "title": "CRM + Automação", "milestone": "m4", "module": "general", "priority": "high", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m4.crm.automacao", "title": "CRM automation", "day_offset": 102, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] },
          { "key": "m4.crm.eventos", "title": "Eventos/tracking", "day_offset": 103, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] },
          { "key": "m4.crm.rotas", "title": "Rotas por origem", "day_offset": 104, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] },
          { "key": "m4.crm.qualificacao", "title": "Qualificação ajustada", "day_offset": 105, "duration_days": 1, "task_type": "internal", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m4.ia_sdr", "title": "IA SDR v2", "milestone": "m4", "module": "general", "priority": "medium", "condition": { "ia_sdr": true },
        "subtasks": [
          { "key": "m4.ia_sdr.otimizacao", "title": "Otimização da IA SDR", "day_offset": 106, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] },
          { "key": "m4.ia_sdr.criterios", "title": "Novos critérios", "day_offset": 107, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] },
          { "key": "m4.ia_sdr.analise", "title": "Análise de qualificação", "day_offset": 108, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] }
        ]
      },
      {
        "key": "m4.conteudo", "title": "Conteúdo de conversão", "milestone": "m4", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m4.conteudo.conversao", "title": "Conteúdo orientado a conversão", "day_offset": 109, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m4.conteudo.prova_social", "title": "Prova social", "day_offset": 110, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m4.conteudo.calendario", "title": "Calendário M4", "day_offset": 111, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m4.conteudo.producao", "title": "Produção", "day_offset": 112, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m4.dados", "title": "Dados", "milestone": "m4", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m4.dados.origem", "title": "Análise por origem/campanha/vendedor", "day_offset": 113, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.dados.painel", "title": "Painel de metas", "day_offset": 114, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.dados.producao", "title": "Mudanças em produção", "day_offset": 115, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.dados.revisao", "title": "Revisão de KPIs", "day_offset": 116, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m4.gestao", "title": "Gestão", "milestone": "m4", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m4.gestao.reuniao", "title": "Reunião mensal", "day_offset": 117, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m4.gestao.fechamento", "title": "Fechamento Mês 04", "day_offset": 120, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m5.plano", "title": "Plano de escala", "milestone": "m5", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m5.plano.o_que", "title": "O que escalar / por quê", "day_offset": 121, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m5.plano.capacidade", "title": "Capacidade comercial", "day_offset": 122, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m5.plano.verba", "title": "Verba definida", "day_offset": 123, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m5.escala", "title": "Escala da campanha vencedora", "milestone": "m5", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m5.escala.scale_up", "title": "Scale up", "day_offset": 124, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.escala.publicos", "title": "Novos públicos", "day_offset": 125, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.escala.criativos", "title": "Novos criativos", "day_offset": 126, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.escala.remar", "title": "Remarketing em escala", "day_offset": 127, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m5.traffic.campaign_03", "title": "Campanha 03", "milestone": "m5", "module": "traffic", "priority": "high", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m5.traffic.campaign_03.criacao", "title": "Criação da campanha 03", "day_offset": 128, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": ["m1.traffic.meta_campaign_01"] },
          { "key": "m5.traffic.campaign_03.criativos", "title": "Criativos", "day_offset": 129, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.traffic.campaign_03.aprovacao", "title": "Aprovação", "day_offset": 130, "duration_days": 1, "task_type": "client", "responsible_role": "client", "depends_on": [] },
          { "key": "m5.traffic.campaign_03.no_ar", "title": "Campanha no ar", "day_offset": 131, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m5.distribuicao", "title": "Distribuição automática", "milestone": "m5", "module": "general", "priority": "medium", "condition": { "needs_crm": true },
        "subtasks": [
          { "key": "m5.distribuicao.leads", "title": "Distribuição de leads", "day_offset": 132, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] },
          { "key": "m5.distribuicao.followup", "title": "Follow-up automático", "day_offset": 133, "duration_days": 1, "task_type": "automation", "responsible_role": "ai", "depends_on": [] },
          { "key": "m5.distribuicao.avancado", "title": "IA + CRM avançado", "day_offset": 134, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m5.google", "title": "Google expansão", "milestone": "m5", "module": "traffic", "priority": "medium", "condition": { "google_ads": true },
        "subtasks": [
          { "key": "m5.google.expansao", "title": "Expansão de contas/campanhas", "day_offset": 135, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.google.keywords", "title": "Novas keywords", "day_offset": 136, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.google.landing", "title": "Landing para Google", "day_offset": 137, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m5.lookalike", "title": "Lookalike + CRM audiences", "milestone": "m5", "module": "traffic", "priority": "medium", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m5.lookalike.lookalike", "title": "Lookalike", "day_offset": 138, "duration_days": 1, "task_type": "automation", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.lookalike.audiences", "title": "CRM audiences", "day_offset": 139, "duration_days": 1, "task_type": "automation", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m5.lookalike.remar", "title": "Remarketing em escala", "day_offset": 140, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m5.lp", "title": "Nova LP", "milestone": "m5", "module": "web", "priority": "low", "condition": { "needs_lp": true },
        "subtasks": [
          { "key": "m5.lp.analise", "title": "Análise — dados justificam?", "day_offset": 141, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m5.lp.nova", "title": "Nova LP/oferta", "day_offset": 142, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] },
          { "key": "m5.lp.publicacao", "title": "Publicação", "day_offset": 143, "duration_days": 1, "task_type": "deliverable", "responsible_role": "developer", "depends_on": [] }
        ]
      },
      {
        "key": "m5.conteudo", "title": "Conteúdo", "milestone": "m5", "module": "social", "priority": "medium", "condition": { "social_media": true },
        "subtasks": [
          { "key": "m5.conteudo.estrategia", "title": "Estratégia de conteúdo para escala", "day_offset": 144, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m5.conteudo.calendario", "title": "Calendário M5", "day_offset": 145, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m5.conteudo.producao", "title": "Produção", "day_offset": 146, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] },
          { "key": "m5.conteudo.publicacao", "title": "Publicação", "day_offset": 147, "duration_days": 1, "task_type": "deliverable", "responsible_role": "social_media", "depends_on": [] }
        ]
      },
      {
        "key": "m5.gestao", "title": "Gestão", "milestone": "m5", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m5.gestao.reuniao", "title": "Reunião mensal", "day_offset": 148, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m5.gestao.fechamento", "title": "Fechamento Mês 05", "day_offset": 150, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m6.auditoria", "title": "Auditoria completa", "milestone": "m6", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m6.auditoria.geral", "title": "Auditoria geral", "day_offset": 151, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.auditoria.cpl", "title": "CPL / CPQL", "day_offset": 152, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.auditoria.funil", "title": "MQL > SQL > oportunidade > venda", "day_offset": 153, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m6.auditoria.cac", "title": "CAC", "day_offset": 154, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m6.financeiro", "title": "Análise financeira", "milestone": "m6", "module": "general", "priority": "high", "condition": null,
        "subtasks": [
          { "key": "m6.financeiro.receita", "title": "Receita por canal", "day_offset": 155, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.financeiro.roas", "title": "ROAS consolidado", "day_offset": 156, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.financeiro.metas", "title": "Definição de metas 6m+", "day_offset": 157, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m6.cadencia", "title": "Auditoria de cadência", "milestone": "m6", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m6.cadencia.cadencia", "title": "Cadência", "day_offset": 158, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m6.cadencia.followup", "title": "Follow-up", "day_offset": 159, "duration_days": 1, "task_type": "internal", "responsible_role": "sales_consultant", "depends_on": [] },
          { "key": "m6.cadencia.automacao", "title": "CRM automation organizada", "day_offset": 160, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m6.ia_sdr", "title": "IA SDR final", "milestone": "m6", "module": "general", "priority": "medium", "condition": { "ia_sdr": true },
        "subtasks": [
          { "key": "m6.ia_sdr.auditoria", "title": "Auditoria da IA SDR", "day_offset": 161, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] },
          { "key": "m6.ia_sdr.refinamento", "title": "Refinamento", "day_offset": 162, "duration_days": 1, "task_type": "internal", "responsible_role": "ai", "depends_on": [] },
          { "key": "m6.ia_sdr.integracao", "title": "Integração avançada IA + CRM", "day_offset": 163, "duration_days": 1, "task_type": "automation", "responsible_role": "crm", "depends_on": [] }
        ]
      },
      {
        "key": "m6.consolidacao", "title": "Consolidação de campanhas", "milestone": "m6", "module": "traffic", "priority": "medium", "condition": { "meta_ads": true },
        "subtasks": [
          { "key": "m6.consolidacao.campanhas", "title": "Consolidação", "day_offset": 164, "duration_days": 1, "task_type": "internal", "responsible_role": "traffic", "depends_on": [] },
          { "key": "m6.consolidacao.conteudo", "title": "Conteúdo vencedor identificado", "day_offset": 165, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.consolidacao.estrutura", "title": "Estrutura definitiva", "day_offset": 166, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.consolidacao.remar", "title": "Remarketing final", "day_offset": 167, "duration_days": 1, "task_type": "deliverable", "responsible_role": "traffic", "depends_on": [] }
        ]
      },
      {
        "key": "m6.playbook", "title": "Playbook", "milestone": "m6", "module": "general", "priority": "high", "condition": null,
        "day_offset": 168, "duration_days": 5,
        "subtasks": [
          { "key": "m6.playbook.comercial", "title": "Playbook comercial", "day_offset": 168, "duration_days": 1, "task_type": "deliverable", "responsible_role": "strategist", "depends_on": ["m6.auditoria.geral", "m6.financeiro.metas", "m6.cadencia.cadencia"] },
          { "key": "m6.playbook.marketing", "title": "Playbook marketing", "day_offset": 169, "duration_days": 1, "task_type": "deliverable", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.playbook.crm_ia", "title": "Playbook CRM + IA", "day_offset": 170, "duration_days": 1, "task_type": "deliverable", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m6.plano", "title": "Plano de escala 6m+", "milestone": "m6", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m6.plano.escala", "title": "Plano de escala", "day_offset": 173, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.plano.roadmap", "title": "Roadmap próximos 6 meses", "day_offset": 174, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.plano.kpis", "title": "KPIs de gestão", "day_offset": 175, "duration_days": 1, "task_type": "internal", "responsible_role": "strategist", "depends_on": [] }
        ]
      },
      {
        "key": "m6.gestao", "title": "Gestão", "milestone": "m6", "module": "general", "priority": "medium", "condition": null,
        "subtasks": [
          { "key": "m6.gestao.reuniao", "title": "Reunião final", "day_offset": 178, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.gestao.dossie", "title": "Entrega do dossiê", "day_offset": 179, "duration_days": 1, "task_type": "deliverable", "responsible_role": "strategist", "depends_on": [] },
          { "key": "m6.gestao.fechamento", "title": "Fechamento Mês 06 / contrato", "day_offset": 180, "duration_days": 1, "task_type": "meeting", "responsible_role": "strategist", "depends_on": [] }
        ]
      }
    ],
    "recurrences": [
      {
        "key": "recur.monitoramento",
        "title": "Monitoramento de campanhas",
        "type": "daily", "start_offset": 5, "end_offset": 180, "step_days": 1,
        "module": "traffic", "priority": "medium", "task_type": "monitoring", "responsible_role": "traffic",
        "condition": { "meta_ads": true }
      },
      {
        "key": "recur.analise_semanal",
        "title": "Análise de performance",
        "type": "weekly", "start_offset": 6, "end_offset": 180, "step_days": 7,
        "module": "traffic", "priority": "medium", "task_type": "internal", "responsible_role": "traffic",
        "condition": null
      },
      {
        "key": "recur.criativos_15d",
        "title": "Novos criativos",
        "type": "biweekly", "start_offset": 8, "end_offset": 180, "step_days": 15,
        "module": "traffic", "priority": "medium", "task_type": "deliverable", "responsible_role": "traffic",
        "condition": { "meta_ads": true }
      },
      {
        "key": "recur.mensal",
        "title": "Reunião mensal / Relatório mensal",
        "type": "monthly", "start_offset": 30, "end_offset": 180, "step_days": 30,
        "module": "general", "priority": "medium", "task_type": "meeting", "responsible_role": "strategist",
        "condition": null
      }
    ]
  }'::jsonb
from public.solutions s
where s.name = 'Solução Comercial em 6 Meses';