# 📙 backend.md — Documentação Backend (MCP Supabase-Ready)

> Sistema Web — Agência + Cliente  
> Stack: Supabase Auth · PostgreSQL · RLS · Edge Functions · RPC · Storage

---

## 1. Stack Backend (Supabase via MCP)

| Camada | Tecnologia | Finalidade |
|---|---|---|
| Autenticação | Supabase Auth | Login, sessão, JWT, roles |
| Banco de Dados | Supabase PostgreSQL 15+ | Modelagem relacional completa |
| Segurança | Row Level Security (RLS) | Isolamento por role e client_id |
| Lógica de Negócio | Stored Procedures (RPC) | Queries complexas e dashboards |
| Automações | Database Triggers | Eventos automáticos no banco |
| Funções Serverless | Edge Functions (Deno) | Integrações externas, PDFs, notificações |
| Arquivos | Supabase Storage | Assets, documentos, relatórios |
| Tempo Real | Supabase Realtime | Chat de suporte, notificações live |

### Convenções Gerais

- Todas as tabelas possuem `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- Todas as tabelas possuem `created_at TIMESTAMPTZ DEFAULT NOW()`
- Todas as tabelas possuem `updated_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at` é atualizado automaticamente por trigger
- UUIDs são usados em todas as chaves estrangeiras
- Soft delete via campo `deleted_at TIMESTAMPTZ NULL`
- RLS habilitado em todas as tabelas

---

## 2. Modelagem (Tabelas)

---

### `profiles`

Extensão da tabela `auth.users` do Supabase. Criada automaticamente via trigger ao registrar usuário.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | FK para `auth.users.id` |
| `full_name` | `TEXT` | ✅ | Nome completo |
| `email` | `TEXT` | ✅ | Email (espelho de auth.users) |
| `role` | `TEXT` | ✅ | `'admin'` ou `'client'` |
| `client_id` | `UUID` | ❌ | FK para `clients.id` (apenas role=client) |
| `avatar_url` | `TEXT` | ❌ | URL do avatar no Storage |
| `phone` | `TEXT` | ❌ | Telefone |
| `is_active` | `BOOLEAN` | ✅ | Default `TRUE` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

**Regras de acesso:**
- `admin` → lê e edita todos os perfis
- `client` → lê e edita apenas o próprio perfil

---

### `clients`

Representa as empresas clientes da agência.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `name` | `TEXT` | ✅ | Nome fantasia |
| `legal_name` | `TEXT` | ❌ | Razão social |
| `cnpj` | `TEXT` | ❌ | CNPJ |
| `email` | `TEXT` | ✅ | Email de contato |
| `phone` | `TEXT` | ❌ | Telefone |
| `logo_url` | `TEXT` | ❌ | Logo no Storage |
| `status` | `TEXT` | ✅ | `'active'`, `'inactive'`, `'onboarding'` |
| `assigned_to` | `UUID` | ❌ | FK para `profiles.id` (membro responsável) |
| `modules_enabled` | `JSONB` | ✅ | `{ traffic: bool, social: bool, web: bool }` |
| `onboarding_step` | `INT` | ✅ | Etapa atual do onboarding (0–N) |
| `onboarding_completed` | `BOOLEAN` | ✅ | Default `FALSE` |
| `deleted_at` | `TIMESTAMPTZ` | ❌ | Soft delete |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

**Regras de acesso:**
- `admin` → acesso total
- `client` → lê apenas o próprio registro (`id = profiles.client_id`)

---

### `team_members`

Membros da agência com papéis internos.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `profile_id` | `UUID` | ✅ | FK para `profiles.id` |
| `internal_role` | `TEXT` | ✅ | `'admin'`, `'editor'`, `'viewer'` |
| `department` | `TEXT` | ❌ | Ex: `'traffic'`, `'social'`, `'web'` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

**Regras de acesso:**
- `admin` → acesso total
- `client` → sem acesso

---

### Módulo: Tráfego Pago

#### `traffic_campaigns`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `name` | `TEXT` | ✅ | Nome da campanha |
| `platform` | `TEXT` | ✅ | `'meta'`, `'google'`, `'tiktok'`, `'linkedin'` |
| `objective` | `TEXT` | ❌ | Ex: `'conversao'`, `'trafego'`, `'alcance'` |
| `status` | `TEXT` | ✅ | `'active'`, `'paused'`, `'ended'`, `'draft'` |
| `budget_total` | `NUMERIC(12,2)` | ❌ | Orçamento total |
| `budget_daily` | `NUMERIC(10,2)` | ❌ | Orçamento diário |
| `start_date` | `DATE` | ❌ | Data de início |
| `end_date` | `DATE` | ❌ | Data de fim |
| `external_id` | `TEXT` | ❌ | ID externo na plataforma |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `traffic_ads`

Anúncios vinculados a campanhas.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `campaign_id` | `UUID` | ✅ | FK para `traffic_campaigns.id` |
| `client_id` | `UUID` | ✅ | FK para `clients.id` (denormalizado para RLS) |
| `name` | `TEXT` | ✅ | Nome do anúncio |
| `format` | `TEXT` | ❌ | `'image'`, `'video'`, `'carousel'`, `'story'` |
| `creative_url` | `TEXT` | ❌ | URL do criativo no Storage |
| `headline` | `TEXT` | ❌ | Título do anúncio |
| `copy` | `TEXT` | ❌ | Texto do anúncio |
| `cta` | `TEXT` | ❌ | Call to action |
| `destination_url` | `TEXT` | ❌ | URL de destino |
| `status` | `TEXT` | ✅ | `'active'`, `'paused'`, `'rejected'`, `'draft'` |
| `external_id` | `TEXT` | ❌ | ID externo na plataforma |
| `is_best` | `BOOLEAN` | ✅ | Default `FALSE` — marcado como top performer |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `traffic_metrics`

Métricas diárias por anúncio ou campanha.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `campaign_id` | `UUID` | ❌ | FK para `traffic_campaigns.id` |
| `ad_id` | `UUID` | ❌ | FK para `traffic_ads.id` |
| `date` | `DATE` | ✅ | Data da métrica |
| `impressions` | `INT` | ❌ | Impressões |
| `clicks` | `INT` | ❌ | Cliques |
| `spend` | `NUMERIC(10,2)` | ❌ | Valor gasto |
| `conversions` | `INT` | ❌ | Conversões |
| `reach` | `INT` | ❌ | Alcance |
| `ctr` | `NUMERIC(6,4)` | ❌ | CTR calculado |
| `cpc` | `NUMERIC(8,4)` | ❌ | CPC calculado |
| `cpm` | `NUMERIC(8,4)` | ❌ | CPM calculado |
| `roas` | `NUMERIC(8,4)` | ❌ | ROAS calculado |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `traffic_reports`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título do relatório |
| `period_start` | `DATE` | ✅ | Início do período |
| `period_end` | `DATE` | ✅ | Fim do período |
| `file_url` | `TEXT` | ❌ | URL do PDF no Storage |
| `summary` | `JSONB` | ❌ | Dados resumidos do relatório |
| `generated_by` | `UUID` | ❌ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

### Módulo: Social Media

#### `social_contents`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título interno |
| `caption` | `TEXT` | ❌ | Legenda do post |
| `hashtags` | `TEXT[]` | ❌ | Array de hashtags |
| `media_urls` | `TEXT[]` | ❌ | URLs dos arquivos no Storage |
| `media_type` | `TEXT` | ❌ | `'image'`, `'video'`, `'carousel'`, `'reel'` |
| `platform` | `TEXT[]` | ✅ | `['instagram', 'facebook', 'linkedin', ...]` |
| `scheduled_at` | `TIMESTAMPTZ` | ❌ | Data/hora de publicação agendada |
| `published_at` | `TIMESTAMPTZ` | ❌ | Data/hora efetiva de publicação |
| `status` | `TEXT` | ✅ | `'draft'`, `'pending_approval'`, `'approved'`, `'rejected'`, `'scheduled'`, `'published'` |
| `created_by` | `UUID` | ❌ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `social_calendar_events`

Eventos do calendário de social media (pode referenciar `social_contents`).

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `content_id` | `UUID` | ❌ | FK para `social_contents.id` |
| `title` | `TEXT` | ✅ | Título do evento |
| `event_date` | `DATE` | ✅ | Data do evento |
| `event_type` | `TEXT` | ✅ | `'post'`, `'story'`, `'live'`, `'meeting'` |
| `platform` | `TEXT` | ❌ | Plataforma alvo |
| `color` | `TEXT` | ❌ | Cor no calendário |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `social_approvals`

Registro de aprovações de conteúdos.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `content_id` | `UUID` | ✅ | FK para `social_contents.id` |
| `reviewed_by` | `UUID` | ❌ | FK para `profiles.id` (quem aprovou/reprovou) |
| `status` | `TEXT` | ✅ | `'pending'`, `'approved'`, `'rejected'` |
| `comment` | `TEXT` | ❌ | Comentário do revisor |
| `reviewed_at` | `TIMESTAMPTZ` | ❌ | Data da revisão |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `social_reports`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título |
| `period_start` | `DATE` | ✅ | Início |
| `period_end` | `DATE` | ✅ | Fim |
| `file_url` | `TEXT` | ❌ | PDF no Storage |
| `summary` | `JSONB` | ❌ | Dados resumidos |
| `generated_by` | `UUID` | ❌ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

### Módulo: Web

#### `web_pages`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título da página |
| `url` | `TEXT` | ❌ | URL da página |
| `page_type` | `TEXT` | ❌ | `'landing'`, `'blog'`, `'product'`, `'home'` |
| `status` | `TEXT` | ✅ | `'active'`, `'draft'`, `'maintenance'` |
| `seo_score` | `INT` | ❌ | Pontuação SEO (0–100) |
| `last_audit_at` | `TIMESTAMPTZ` | ❌ | Data da última auditoria |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `web_audits`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `page_id` | `UUID` | ❌ | FK para `web_pages.id` |
| `audit_date` | `DATE` | ✅ | Data da auditoria |
| `seo_score` | `INT` | ❌ | 0–100 |
| `performance_score` | `INT` | ❌ | 0–100 |
| `accessibility_score` | `INT` | ❌ | 0–100 |
| `issues` | `JSONB` | ❌ | Lista de problemas encontrados |
| `recommendations` | `JSONB` | ❌ | Lista de recomendações |
| `conducted_by` | `UUID` | ❌ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `web_deliveries`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título da entrega |
| `description` | `TEXT` | ❌ | Descrição |
| `delivery_type` | `TEXT` | ❌ | `'page'`, `'feature'`, `'fix'`, `'integration'` |
| `status` | `TEXT` | ✅ | `'planned'`, `'in_progress'`, `'delivered'`, `'approved'` |
| `delivered_at` | `TIMESTAMPTZ` | ❌ | Data de entrega |
| `due_date` | `DATE` | ❌ | Prazo |
| `file_urls` | `TEXT[]` | ❌ | Arquivos relacionados no Storage |
| `delivered_by` | `UUID` | ❌ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

### Módulo: Geral

#### `tasks`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ❌ | FK para `clients.id` (pode ser tarefa interna) |
| `title` | `TEXT` | ✅ | Título |
| `description` | `TEXT` | ❌ | Descrição |
| `module` | `TEXT` | ❌ | `'traffic'`, `'social'`, `'web'`, `'general'` |
| `status` | `TEXT` | ✅ | `'todo'`, `'in_progress'`, `'review'`, `'done'` |
| `priority` | `TEXT` | ✅ | `'low'`, `'medium'`, `'high'`, `'urgent'` |
| `assigned_to` | `UUID` | ❌ | FK para `profiles.id` |
| `created_by` | `UUID` | ✅ | FK para `profiles.id` |
| `due_date` | `DATE` | ❌ | Prazo |
| `completed_at` | `TIMESTAMPTZ` | ❌ | Data de conclusão |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `documents`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ❌ | FK para `clients.id` |
| `title` | `TEXT` | ✅ | Título |
| `description` | `TEXT` | ❌ | Descrição |
| `file_url` | `TEXT` | ✅ | URL no Storage |
| `file_type` | `TEXT` | ❌ | `'pdf'`, `'image'`, `'doc'`, `'spreadsheet'` |
| `file_size` | `INT` | ❌ | Tamanho em bytes |
| `category` | `TEXT` | ❌ | `'contract'`, `'brief'`, `'report'`, `'creative'` |
| `uploaded_by` | `UUID` | ✅ | FK para `profiles.id` |
| `deleted_at` | `TIMESTAMPTZ` | ❌ | Soft delete |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `support_messages`

Chat de suporte entre cliente e agência.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `ticket_id` | `UUID` | ✅ | FK para `support_tickets.id` |
| `sender_id` | `UUID` | ✅ | FK para `profiles.id` |
| `message` | `TEXT` | ✅ | Conteúdo da mensagem |
| `attachment_url` | `TEXT` | ❌ | Arquivo anexado |
| `read_at` | `TIMESTAMPTZ` | ❌ | Quando foi lida |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

#### `support_tickets`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `subject` | `TEXT` | ✅ | Assunto |
| `status` | `TEXT` | ✅ | `'open'`, `'in_progress'`, `'resolved'`, `'closed'` |
| `priority` | `TEXT` | ✅ | `'low'`, `'medium'`, `'high'` |
| `assigned_to` | `UUID` | ❌ | FK para `profiles.id` |
| `resolved_at` | `TIMESTAMPTZ` | ❌ | Data de resolução |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `financial_invoices`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `description` | `TEXT` | ✅ | Descrição da cobrança |
| `amount` | `NUMERIC(12,2)` | ✅ | Valor |
| `status` | `TEXT` | ✅ | `'pending'`, `'paid'`, `'overdue'`, `'cancelled'` |
| `due_date` | `DATE` | ✅ | Vencimento |
| `paid_at` | `TIMESTAMPTZ` | ❌ | Data de pagamento |
| `file_url` | `TEXT` | ❌ | Boleto/NF no Storage |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `flows`

Fluxos de onboarding e automação.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `name` | `TEXT` | ✅ | Nome do fluxo |
| `description` | `TEXT` | ❌ | Descrição |
| `flow_type` | `TEXT` | ✅ | `'onboarding'`, `'campaign'`, `'delivery'` |
| `steps` | `JSONB` | ✅ | Array de etapas `[{ step, title, description, order }]` |
| `is_active` | `BOOLEAN` | ✅ | Default `TRUE` |
| `created_by` | `UUID` | ✅ | FK para `profiles.id` |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

#### `flow_progress`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `flow_id` | `UUID` | ✅ | FK para `flows.id` |
| `client_id` | `UUID` | ✅ | FK para `clients.id` |
| `current_step` | `INT` | ✅ | Etapa atual |
| `completed_steps` | `INT[]` | ✅ | Etapas concluídas |
| `completed_at` | `TIMESTAMPTZ` | ❌ | Data de conclusão total |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

#### `notifications`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `UUID` | ✅ | PK |
| `user_id` | `UUID` | ✅ | FK para `profiles.id` (destinatário) |
| `client_id` | `UUID` | ❌ | FK para `clients.id` (contexto) |
| `type` | `TEXT` | ✅ | `'approval'`, `'task'`, `'report'`, `'support'`, `'financial'` |
| `title` | `TEXT` | ✅ | Título da notificação |
| `body` | `TEXT` | ❌ | Corpo |
| `link` | `TEXT` | ❌ | Rota de redirecionamento |
| `read_at` | `TIMESTAMPTZ` | ❌ | Quando foi lida |
| `created_at` | `TIMESTAMPTZ` | ✅ | Auto |

---

## 3. RLS Policies (MCP-Compatible)

### Padrão de Definição

Cada policy é definida com:
- **Tabela**
- **Operação**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- **Role alvo**: `authenticated`
- **Condição USING / WITH CHECK**

---

### Funções Helper (criar antes das policies)

```sql
-- Retorna o role do usuário logado
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Retorna o client_id do usuário logado
CREATE OR REPLACE FUNCTION auth_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### Policies por Tabela

#### `profiles`

| Operação | Role | Condição |
|---|---|---|
| SELECT | admin | `is_admin() = TRUE` |
| SELECT | client | `id = auth.uid()` |
| UPDATE | admin | `is_admin() = TRUE` |
| UPDATE | client | `id = auth.uid()` |
| INSERT | admin | `is_admin() = TRUE` |
| DELETE | admin | `is_admin() = TRUE` |

---

#### `clients`

| Operação | Condição |
|---|---|
| SELECT admin | `is_admin() = TRUE` |
| SELECT client | `id = auth_client_id()` |
| INSERT | `is_admin() = TRUE` |
| UPDATE admin | `is_admin() = TRUE` |
| UPDATE client | `id = auth_client_id()` (campos limitados) |
| DELETE | `is_admin() = TRUE` |

---

#### Tabelas de Módulos (`traffic_campaigns`, `traffic_ads`, `traffic_metrics`, `social_contents`, etc.)

O padrão se repete para todas as tabelas que possuem `client_id`:

| Operação | Condição |
|---|---|
| SELECT admin | `is_admin() = TRUE` |
| SELECT client | `client_id = auth_client_id()` |
| INSERT | `is_admin() = TRUE` |
| UPDATE | `is_admin() = TRUE` |
| DELETE | `is_admin() = TRUE` |

> **Nota para MCP:** Aplicar este padrão em todas as tabelas com campo `client_id`:
> `traffic_campaigns`, `traffic_ads`, `traffic_metrics`, `traffic_reports`,
> `social_contents`, `social_approvals`, `social_reports`, `social_calendar_events`,
> `web_pages`, `web_audits`, `web_deliveries`,
> `tasks`, `documents`, `support_tickets`, `support_messages`,
> `financial_invoices`, `flow_progress`, `notifications`

---

#### `social_approvals` — Regra especial para clientes

| Operação | Condição |
|---|---|
| SELECT client | `client_id = auth_client_id()` |
| INSERT client | `client_id = auth_client_id()` (cliente pode aprovar/reprovar) |
| UPDATE client | `client_id = auth_client_id() AND status IN ('approved','rejected')` |

---

#### `notifications`

| Operação | Condição |
|---|---|
| SELECT | `user_id = auth.uid()` |
| UPDATE | `user_id = auth.uid()` (apenas marcar como lida) |
| INSERT | `is_admin() = TRUE` |
| DELETE | `user_id = auth.uid() OR is_admin() = TRUE` |

---

#### `support_messages`

| Operação | Condição |
|---|---|
| SELECT admin | `is_admin() = TRUE` |
| SELECT client | `client_id = auth_client_id()` |
| INSERT | `sender_id = auth.uid()` |
| UPDATE | Proibido (mensagens são imutáveis) |
| DELETE | `is_admin() = TRUE` |

---

## 4. Edge Functions

Todas as Edge Functions são escritas em **TypeScript/Deno** e deployadas via `supabase functions deploy`.

---

### `process_report`

**Finalidade:** Consolida métricas e gera dados estruturados de relatório.

**Entrada:**
```json
{
  "client_id": "uuid",
  "module": "traffic | social | web",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31"
}
```

**Saída:**
```json
{
  "report_id": "uuid",
  "summary": { ... },
  "file_url": "string | null"
}
```

**Uso:** Chamada pelo admin ao gerar relatório. Agrega métricas do período e salva em `traffic_reports` ou `social_reports`.

---

### `process_metrics`

**Finalidade:** Recebe métricas brutas de plataformas externas e normaliza para o banco.

**Entrada:**
```json
{
  "client_id": "uuid",
  "platform": "meta | google | tiktok",
  "raw_metrics": [ ... ],
  "date": "2024-01-15"
}
```

**Saída:**
```json
{
  "inserted": 12,
  "updated": 3,
  "errors": []
}
```

**Uso:** Webhook ou cron job de integração com APIs das plataformas de anúncios.

---

### `notify_client`

**Finalidade:** Cria notificação e (opcionalmente) envia email para o cliente.

**Entrada:**
```json
{
  "client_id": "uuid",
  "type": "approval | report | task | support | financial",
  "title": "string",
  "body": "string",
  "link": "string"
}
```

**Saída:**
```json
{
  "notification_id": "uuid",
  "email_sent": true
}
```

**Uso:** Chamada por triggers do banco ou por outras Edge Functions após eventos importantes.

---

### `generate_pdf`

**Finalidade:** Gera arquivo PDF de relatório e faz upload no Storage.

**Entrada:**
```json
{
  "report_id": "uuid",
  "module": "traffic | social | web",
  "template": "default | detailed"
}
```

**Saída:**
```json
{
  "file_url": "string",
  "file_size": 12345
}
```

**Uso:** Chamada após `process_report`. Usa biblioteca de PDF (ex: `pdf-lib` ou serviço externo). Salva no bucket `reports/`.

---

### `update_onboarding_step`

**Finalidade:** Avança ou completa etapa do onboarding de um cliente.

**Entrada:**
```json
{
  "client_id": "uuid",
  "step": 3,
  "completed": true
}
```

**Saída:**
```json
{
  "current_step": 4,
  "onboarding_completed": false,
  "next_step_title": "Aprovação de identidade visual"
}
```

**Uso:** Chamado pelo frontend ao marcar etapa como concluída, ou automaticamente por triggers.

---

## 5. RPC (Stored Procedures via Supabase)

Todas as RPCs são chamadas via `supabase.rpc('nome_da_funcao', { params })`.

---

### `get_client_dashboard`

**Parâmetros:** `p_client_id UUID`

**Retorna:** JSONB com:
- Resumo de tráfego (gasto, impressões, conversões no mês)
- Resumo de social (posts publicados, aprovações pendentes)
- Resumo web (páginas ativas, score médio, entregas recentes)
- Tarefas abertas
- Notificações não lidas

**Uso:** Carrega o dashboard do cliente em uma única chamada.

---

### `get_traffic_overview`

**Parâmetros:** `p_client_id UUID, p_start DATE, p_end DATE`

**Retorna:** JSONB com:
- Total gasto no período
- Total de impressões, cliques, conversões
- CTR médio, CPC médio, ROAS médio
- Campanha com melhor performance
- Top 3 anúncios por ROAS

**Uso:** Dashboard de Tráfego Pago do cliente.

---

### `get_social_overview`

**Parâmetros:** `p_client_id UUID, p_start DATE, p_end DATE`

**Retorna:** JSONB com:
- Total de posts no período por plataforma
- Posts aprovados vs reprovados
- Posts publicados vs agendados
- Aprovações pendentes

**Uso:** Dashboard de Social Media do cliente.

---

### `get_web_overview`

**Parâmetros:** `p_client_id UUID`

**Retorna:** JSONB com:
- Total de páginas ativas
- Score SEO médio
- Última auditoria (data + scores)
- Entregas recentes
- Entregas em andamento

**Uso:** Dashboard Web do cliente.

---

### `get_best_ads`

**Parâmetros:** `p_client_id UUID, p_start DATE, p_end DATE, p_metric TEXT (default: 'roas'), p_limit INT (default: 10)`

**Retorna:** Array de anúncios com métricas ordenadas pela métrica escolhida.

**Uso:** Tela "Melhores Anúncios" do módulo de Tráfego.

---

### `create_task`

**Parâmetros:** `p_client_id UUID, p_title TEXT, p_description TEXT, p_module TEXT, p_priority TEXT, p_assigned_to UUID, p_due_date DATE`

**Retorna:** `task_id UUID`

**Uso:** Criação de tarefa com validações de negócio (ex: verificar se cliente existe e está ativo).

---

### `approve_item`

**Parâmetros:** `p_item_id UUID, p_item_type TEXT ('social_content' | 'web_delivery'), p_status TEXT ('approved' | 'rejected'), p_comment TEXT`

**Retorna:** `{ success: bool, new_status: text, notification_sent: bool }`

**Uso:** Aprovação centralizada de qualquer item (social ou web). Atualiza status, registra em `social_approvals` e dispara `notify_client`.

---

## 6. Storage (Buckets)

### `creative_assets`

| Atributo | Valor |
|---|---|
| Público | Não (signed URLs) |
| Pasta padrão | `/{client_id}/ads/`, `/{client_id}/social/` |
| Tipos permitidos | `image/*`, `video/*` |
| Tamanho máximo | 100MB |

**Policies:**
- `admin` → read/write em tudo
- `client` → read em `/{client_id}/*` · write em `/{client_id}/social/*`

---

### `web_files`

| Atributo | Valor |
|---|---|
| Público | Não |
| Pasta padrão | `/{client_id}/pages/`, `/{client_id}/deliveries/` |
| Tipos permitidos | Todos |
| Tamanho máximo | 50MB |

**Policies:**
- `admin` → read/write em tudo
- `client` → read em `/{client_id}/*`

---

### `documents`

| Atributo | Valor |
|---|---|
| Público | Não |
| Pasta padrão | `/{client_id}/`, `/internal/` |
| Tipos permitidos | `application/pdf`, `image/*`, `application/msword`, etc. |
| Tamanho máximo | 25MB |

**Policies:**
- `admin` → read/write em tudo
- `client` → read em `/{client_id}/*`

---

### `reports`

| Atributo | Valor |
|---|---|
| Público | Não |
| Pasta padrão | `/{client_id}/traffic/`, `/{client_id}/social/`, `/{client_id}/web/` |
| Tipos permitidos | `application/pdf` |
| Tamanho máximo | 20MB |

**Policies:**
- `admin` → read/write em tudo
- `client` → read em `/{client_id}/*`

---

## 7. Fluxos de Automação (Triggers)

### Trigger 1: `on_checklist_step_completed`

**Evento:** `AFTER UPDATE ON flow_progress`  
**Condição:** `NEW.completed_steps != OLD.completed_steps`

**Ação:**
1. Verifica se todos os steps do fluxo foram completados
2. Se sim: atualiza `clients.onboarding_completed = TRUE` e `clients.status = 'active'`
3. Chama `update_onboarding_step` para registrar conclusão
4. Insere notificação em `notifications` para o admin

---

### Trigger 2: `on_creative_uploaded`

**Evento:** `AFTER INSERT ON traffic_ads` (quando `creative_url IS NOT NULL`)  
**Condição:** `NEW.creative_url IS NOT NULL AND OLD.creative_url IS NULL`

**Ação:**
1. Registra evento em `documents` com `category = 'creative'`
2. Insere notificação para o admin responsável pelo cliente
3. Atualiza `updated_at` da campanha relacionada

---

### Trigger 3: `on_campaign_updated`

**Evento:** `AFTER UPDATE ON traffic_campaigns`  
**Condição:** Qualquer mudança em `status`, `budget_total`, `budget_daily`

**Ação:**
1. Marca métricas do período atual como `stale = TRUE` (flag para recalcular)
2. Chama `process_metrics` de forma assíncrona via Edge Function (pg_net ou NOTIFY)
3. Registra log de alteração em tabela `audit_logs` (opcional)

---

### Trigger 4: `on_approval_submitted`

**Evento:** `AFTER INSERT OR UPDATE ON social_approvals`

**Ação:**
1. Se `status = 'approved'`: atualiza `social_contents.status = 'approved'`
2. Se `status = 'rejected'`: atualiza `social_contents.status = 'rejected'`
3. Chama `notify_client` via Edge Function com resultado da aprovação

---

### Trigger 5: `on_profile_created`

**Evento:** `AFTER INSERT ON auth.users`

**Ação:**
1. Cria registro em `profiles` com dados básicos do usuário
2. Se `role = 'client'`, cria registro inicial em `flow_progress` para o fluxo de onboarding padrão

---

### Trigger Utilitário: `set_updated_at`

**Aplicado em:** Todas as tabelas com campo `updated_at`

**Ação:** Define `NEW.updated_at = NOW()` antes de qualquer `UPDATE`

```sql
-- Exemplo de definição (aplicar em cada tabela)
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON nome_da_tabela
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 8. Estrutura SQL Final

> Este arquivo descreve a estrutura para geração via MCP. As instruções abaixo orientam a ordem de criação no banco.

### Ordem de Execução pelo MCP

```
1. FUNÇÕES HELPER
   - update_updated_at_column()
   - auth_role()
   - auth_client_id()
   - is_admin()

2. TABELAS BASE (sem FKs externas)
   - profiles (referencia auth.users)
   - clients

3. TABELAS DE RELAÇÃO
   - team_members
   - flows
   - flow_progress

4. TABELAS DE MÓDULOS
   4a. Tráfego
       - traffic_campaigns
       - traffic_ads
       - traffic_metrics
       - traffic_reports
   4b. Social Media
       - social_contents
       - social_calendar_events
       - social_approvals
       - social_reports
   4c. Web
       - web_pages
       - web_audits
       - web_deliveries

5. TABELAS GERAIS
   - tasks
   - documents
   - support_tickets
   - support_messages
   - financial_invoices
   - notifications

6. TRIGGERS
   - set_updated_at → todas as tabelas
   - on_profile_created
   - on_checklist_step_completed
   - on_creative_uploaded
   - on_campaign_updated
   - on_approval_submitted

7. RLS
   - Habilitar RLS em todas as tabelas
   - Criar policies SELECT / INSERT / UPDATE / DELETE por tabela
   - Aplicar padrão admin/client descrito na seção 3

8. STORAGE
   - Criar buckets: creative_assets, web_files, documents, reports
   - Configurar policies de storage

9. RPC (STORED PROCEDURES)
   - get_client_dashboard
   - get_traffic_overview
   - get_social_overview
   - get_web_overview
   - get_best_ads
   - create_task
   - approve_item

10. EDGE FUNCTIONS (deploy separado)
    - process_report
    - process_metrics
    - notify_client
    - generate_pdf
    - update_onboarding_step
```

---

> **Nota para a IDE com MCP Supabase:** Cada seção deste documento corresponde a um conjunto de instruções SQL ou configurações que podem ser gerados automaticamente. Seguir a ordem da seção 8 garante que dependências (FKs, funções helper, etc.) sejam criadas antes das entidades que as referenciam.
