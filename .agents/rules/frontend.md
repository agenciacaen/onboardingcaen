# 📘 frontend.md — Documentação Frontend

> Sistema Web — Visão Agência + Visão Cliente  
> Stack: React · shadcn/ui · Tailwind · Supabase Client · Zustand

---

## 1. Stack & Arquitetura

### Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | React 18+ (Vite) ou Next.js 14+ (App Router) |
| UI Components | shadcn/ui |
| Estilização | Tailwind CSS v3+ |
| Roteamento | React Router v6 (Vite) ou Next.js App Router |
| Estado Global | Zustand |
| Backend-as-a-Service | Supabase (Auth + DB + Storage + Realtime) |
| Cliente Supabase | `@supabase/supabase-js` + `@supabase/auth-helpers-react` |
| Formulários | React Hook Form + Zod |
| Tabelas / Data | TanStack Table v8 |
| Datas | date-fns |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Notificações | Sonner (toast) |

### Hierarquia de Rotas

```
/                        → Redireciona conforme role
/login                   → Autenticação
/agency/*                → Visão da Agência (role: admin)
/client/*                → Visão do Cliente (role: client)
/onboarding              → Fluxo inicial do cliente
```

### Controle de Acesso por Role

- `admin` → acessa `/agency/*`
- `client` → acessa `/client/*`
- Redirecionamento automático pós-login baseado no campo `role` do perfil Supabase

---

## 2. Sidebar

### Comportamento

- **Expande** ao hover sobre a sidebar recolhida
- **Recolhe** automaticamente ao perder o foco (blur / mouse leave)
- **Estado persistido** via Zustand (`useSidebarStore`)
- Largura recolhida: `64px` (apenas ícones)
- Largura expandida: `240px` (ícones + labels)
- Transição suave: `transition-all duration-300`

### Estrutura do Componente

```tsx
<Sidebar>
  <SidebarHeader>       // Logo + toggle
  <SidebarNav>
    <SidebarGroup label="Principal">
      <SidebarItem icon={...} label="Dashboard" href="/..." />
    </SidebarGroup>
    <SidebarGroup label="Módulos">
      ...
    </SidebarGroup>
  </SidebarNav>
  <SidebarFooter>       // Avatar do usuário + logout
</Sidebar>
```

### Sidebar — Agência (admin)

| Grupo | Item | Ícone |
|---|---|---|
| Principal | Dashboard | `LayoutDashboard` |
| Gestão | Clientes | `Users` |
| Gestão | Equipe | `UserCheck` |
| Operacional | Calendário | `CalendarDays` |
| Operacional | Tarefas | `CheckSquare` |
| Operacional | Fluxos | `GitBranch` |
| Conteúdo | Documentos | `FileText` |
| Análise | Relatórios | `BarChart2` |

### Sidebar — Cliente

| Grupo | Item | Ícone |
|---|---|---|
| Principal | Dashboard | `LayoutDashboard` |
| Início | Onboarding | `Rocket` |
| Módulos | Tráfego Pago | `TrendingUp` |
| Módulos | Social Media | `Share2` |
| Módulos | Web | `Globe` |
| Ações | Aprovações | `ThumbsUp` |
| Suporte | Suporte | `MessageCircle` |
| Financeiro | Financeiro | `DollarSign` |

---

## 3. Estrutura de Pastas

```
/src
│
├── /app
│   ├── /agency                  # Rotas da Agência
│   │   ├── page.tsx             # Dashboard Agência
│   │   ├── /clients
│   │   ├── /calendar
│   │   ├── /tasks
│   │   ├── /flows
│   │   ├── /team
│   │   ├── /documents
│   │   └── /reports
│   │
│   └── /client                  # Rotas do Cliente
│       ├── page.tsx             # Dashboard Cliente
│       ├── /onboarding
│       ├── /traffic
│       │   ├── page.tsx         # Dashboard Tráfego
│       │   ├── /campaigns
│       │   │   └── /[id]/ads
│       │   ├── /best-ads
│       │   └── /reports
│       ├── /social
│       │   ├── page.tsx
│       │   ├── /calendar
│       │   ├── /contents
│       │   ├── /approvals
│       │   └── /reports
│       ├── /web
│       │   ├── page.tsx
│       │   ├── /pages
│       │   ├── /audits
│       │   └── /deliveries
│       ├── /approvals
│       ├── /support
│       └── /financial
│
├── /modules
│   ├── /traffic
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── /social
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── /web
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── /components
│   ├── /ui                      # Componentes shadcn/ui
│   ├── /sidebar
│   ├── /charts
│   ├── /tables
│   ├── /cards
│   ├── /modals
│   └── /forms
│
├── /layouts
│   ├── AgencyLayout.tsx
│   ├── ClientLayout.tsx
│   └── AuthLayout.tsx
│
├── /hooks
│   ├── useAuth.ts
│   ├── useSidebar.ts
│   ├── useProfile.ts
│   └── useSupabase.ts
│
├── /services
│   ├── supabase.ts              # Cliente Supabase singleton
│   ├── auth.service.ts
│   ├── traffic.service.ts
│   ├── social.service.ts
│   └── web.service.ts
│
├── /store
│   ├── authStore.ts             # Zustand: sessão e perfil
│   ├── sidebarStore.ts          # Zustand: estado da sidebar
│   └── notificationStore.ts     # Zustand: notificações
│
└── /types
    ├── auth.types.ts
    ├── agency.types.ts
    ├── client.types.ts
    ├── traffic.types.ts
    ├── social.types.ts
    └── web.types.ts
```

---

## 4. Layouts

### Layout Agência (`AgencyLayout.tsx`)

Envolve todas as rotas em `/agency/*`.

**Estrutura visual:**
```
┌──────────────────────────────────────────────┐
│  Sidebar (recolhível)  │  Header (topbar)     │
│                        │─────────────────────│
│  - Dashboard           │                     │
│  - Clientes            │   <Outlet />        │
│  - Calendário          │   (conteúdo da rota)│
│  - Tarefas             │                     │
│  - Fluxos              │                     │
│  - Equipe              │                     │
│  - Documentos          │                     │
│  - Relatórios          │                     │
└──────────────────────────────────────────────┘
```

**Componentes do Header:**
- Breadcrumb dinâmico
- Seletor de cliente ativo (dropdown)
- Notificações (badge com contador)
- Avatar do usuário (menu com logout)

**Módulos carregados:**
- `Dashboard` — visão geral de todos os clientes
- `Clientes` — CRUD de clientes e acesso aos módulos
- `Calendário` — calendário de postagens e tarefas
- `Tarefas` — board de tarefas (kanban)
- `Fluxos` — automações e onboardings configurados
- `Equipe` — membros da agência e permissões
- `Documentos` — repositório de arquivos
- `Relatórios` — geração e visualização de relatórios

---

### Layout Cliente (`ClientLayout.tsx`)

Envolve todas as rotas em `/client/*`.

**Estrutura visual:**
```
┌──────────────────────────────────────────────┐
│  Sidebar (recolhível)  │  Header (topbar)     │
│                        │─────────────────────│
│  - Dashboard           │                     │
│  - Onboarding          │   <Outlet />        │
│  - Tráfego Pago        │   (conteúdo da rota)│
│  - Social Media        │                     │
│  - Web                 │                     │
│  - Aprovações          │                     │
│  - Suporte             │                     │
│  - Financeiro          │                     │
└──────────────────────────────────────────────┘
```

**Componentes do Header:**
- Nome do cliente / empresa
- Notificações de aprovações pendentes
- Avatar do usuário

**Módulos carregados:**
- `Dashboard` — resumo geral da conta
- `Onboarding` — checklist de ativação
- `Tráfego Pago` — campanhas, anúncios, métricas
- `Social Media` — calendário, conteúdos, aprovações
- `Web` — páginas, auditorias, entregas
- `Aprovações` — itens pendentes de aprovação
- `Suporte` — chat/tickets com a agência
- `Financeiro` — faturas, planos e histórico

---

## 5. Módulos — Visão Agência

### Dashboard (`/agency`)

**Componentes:**
- `ClientSummaryGrid` — cards de resumo por cliente
- `TasksBoardPreview` — tarefas prioritárias
- `UpcomingCalendarWidget` — próximos eventos
- `TeamActivityFeed` — atividades recentes da equipe

**Dados exibidos:**
- Total de clientes ativos
- Tarefas em aberto
- Aprovações pendentes
- Relatórios a gerar

---

### Clientes (`/agency/clients`)

**Telas:**
- `ClientListPage` — tabela de clientes com filtros e busca
- `ClientDetailPage` — perfil completo do cliente
- `ClientCreateModal` — formulário de criação
- `ClientEditModal` — formulário de edição
- `ClientModulesPanel` — ativar/desativar módulos por cliente

**Campos do formulário:**
- Nome, razão social, CNPJ
- Email, telefone
- Responsável (membro da equipe)
- Módulos ativos (Tráfego / Social / Web)
- Status (ativo, inativo, onboarding)

---

### Calendário (`/agency/calendar`)

**Componentes:**
- `MonthlyCalendarView` — visualização mensal
- `WeeklyCalendarView` — visualização semanal
- `EventCreateModal` — criação de evento/tarefa
- `ClientFilterBar` — filtrar por cliente

**Tipos de eventos:**
- Postagem social media
- Entrega web
- Reunião
- Relatório

---

### Tarefas (`/agency/tasks`)

**Componentes:**
- `KanbanBoard` — colunas: A Fazer / Em Andamento / Revisão / Concluído
- `TaskCard` — card da tarefa com prioridade, responsável, prazo
- `TaskCreateModal`
- `TaskFilterBar` — filtrar por cliente, responsável, módulo

---

### Fluxos (`/agency/flows`)

**Componentes:**
- `FlowListPage` — lista de automações configuradas
- `OnboardingFlowEditor` — editor de etapas do onboarding
- `FlowDetailPage` — progresso dos clientes em cada fluxo

---

### Equipe (`/agency/team`)

**Componentes:**
- `TeamMemberList` — tabela de membros
- `MemberInviteModal` — convite por email
- `MemberRoleSelector` — definir papel (admin / editor / viewer)

---

### Documentos (`/agency/documents`)

**Componentes:**
- `DocumentLibrary` — lista com filtros por tipo e cliente
- `DocumentUploadModal` — upload com metadados
- `DocumentPreviewModal` — preview inline (PDF / imagem)

---

### Relatórios (`/agency/reports`)

**Componentes:**
- `ReportListPage` — relatórios gerados
- `ReportGeneratorModal` — selecionar cliente, módulo, período
- `ReportPreviewPage` — visualização do relatório

---

## 6. Módulos — Visão Cliente

### Dashboard (`/client`)

**Componentes:**
- `WelcomeBanner` — mensagem de boas-vindas + progresso do onboarding
- `ModuleSummaryCards` — resumo de Tráfego / Social / Web
- `RecentApprovalsWidget`
- `SupportTicketWidget`

---

### Onboarding (`/client/onboarding`)

**Componentes:**
- `OnboardingChecklist` — lista de etapas com status (pendente / completo)
- `OnboardingStepDetail` — detalhe de cada etapa com instruções
- `OnboardingProgressBar`

**Etapas típicas:**
1. Dados da empresa
2. Acesso às plataformas de anúncios
3. Briefing de redes sociais
4. Aprovação de identidade visual
5. Configuração do site

---

### Tráfego Pago

#### Dashboard (`/client/traffic`)
**Componentes:**
- `TrafficKpiCards` — Impressões, Cliques, CTR, CPC, ROAS
- `SpendOverTimeChart` — gráfico de investimento
- `CampaignStatusSummary`
- `BestAdPreview` — top 3 anúncios

---

#### Campanhas (`/client/traffic/campaigns`)
**Componentes:**
- `CampaignTable` — listagem com status, orçamento, resultados
- `CampaignDetailPage` — métricas detalhadas da campanha
- `AdSetList` — conjuntos de anúncios dentro da campanha

---

#### Anúncios (`/client/traffic/campaigns/[id]/ads`)
**Componentes:**
- `AdCardGrid` — cards visuais dos anúncios (imagem/vídeo + métricas)
- `AdDetailModal` — métricas completas do anúncio
- `AdStatusBadge`

---

#### Melhores Anúncios (`/client/traffic/best-ads`)
**Componentes:**
- `BestAdsGallery` — galeria filtrada por período e métricas
- `AdComparePanel` — comparação lado a lado

---

#### Relatórios de Tráfego (`/client/traffic/reports`)
**Componentes:**
- `TrafficReportList`
- `TrafficReportViewer` — PDF inline + download

---

### Social Media

#### Calendário (`/client/social/calendar`)
**Componentes:**
- `SocialCalendarMonthView`
- `PostPreviewPopover` — preview do post ao clicar
- `PostStatusLegend` — legenda de status (rascunho / agendado / publicado / reprovado)

---

#### Conteúdos (`/client/social/contents`)
**Componentes:**
- `ContentList` — tabela com status e canal (Instagram, Facebook, LinkedIn...)
- `ContentDetailModal` — texto, imagem/vídeo, legenda, hashtags
- `ContentStatusBadge`

---

#### Aprovações Social (`/client/social/approvals`)
**Componentes:**
- `ApprovalQueue` — lista de itens aguardando aprovação
- `ApprovalCard` — visualizar + aprovar / reprovar com comentário
- `ApprovalHistoryTable`

---

#### Relatórios Social (`/client/social/reports`)
**Componentes:**
- `SocialReportList`
- `SocialReportViewer`

---

### Web

#### Páginas (`/client/web/pages`)
**Componentes:**
- `PageList` — lista de páginas com status e URL
- `PageDetailPanel` — SEO, performance, última atualização

---

#### Auditorias (`/client/web/audits`)
**Componentes:**
- `AuditList` — histórico de auditorias
- `AuditDetailPage` — pontuação SEO, performance, acessibilidade, itens de melhoria

---

#### Entregas Web (`/client/web/deliveries`)
**Componentes:**
- `DeliveryTimeline` — linha do tempo de entregas
- `DeliveryCard` — nome, descrição, data, status, arquivos anexos

---

### Aprovações (`/client/approvals`)

Centraliza aprovações de todos os módulos.

**Componentes:**
- `ApprovalUnifiedQueue` — filtrado por módulo (Social / Web / Docs)
- `ApprovalBadgeCount` — exibido na sidebar

---

### Suporte (`/client/support`)

**Componentes:**
- `SupportTicketList` — tickets abertos e resolvidos
- `TicketCreateModal`
- `TicketChatView` — chat interno por ticket (Supabase Realtime)

---

### Financeiro (`/client/financial`)

**Componentes:**
- `InvoiceList` — faturas com status (pago / pendente / vencido)
- `PlanSummaryCard` — plano atual e módulos contratados
- `PaymentHistoryTable`

---

## 7. Componentes Reutilizáveis

### Layout & Navegação
- `Sidebar` / `SidebarItem` / `SidebarGroup`
- `TopBar`
- `Breadcrumb`
- `PageHeader` (título + ações)

### Dados
- `DataTable` (TanStack Table wrapper com filtros, paginação, ordenação)
- `KanbanBoard` / `KanbanCard`
- `StatsCard` (KPI card com ícone, valor, variação %)
- `TimelineList`

### Gráficos
- `LineChart` (Recharts wrapper)
- `BarChart`
- `DonutChart`
- `SparklineCard`

### UI Geral
- `StatusBadge` (colorido por status)
- `AvatarGroup`
- `FileUploader` (drag-and-drop + preview)
- `RichTextEditor`
- `DateRangePicker`
- `ConfirmDialog`
- `EmptyState`
- `LoadingSkeleton`
- `NotificationDropdown`
- `UserAvatarMenu`

### Formulários
- `FormField` (wrapper React Hook Form + Zod)
- `SelectField`
- `MultiSelectField`
- `ImageUploadField`
- `DatePickerField`

---

## 8. Fluxo de Autenticação

### Login

1. Usuário acessa `/login`
2. Preenche email + senha
3. Chama `supabase.auth.signInWithPassword()`
4. Supabase retorna sessão + `user.id`
5. Hook `useAuth` busca o perfil em `profiles` via RPC ou query direta
6. Perfil retorna `role` (`admin` | `client`) e `client_id` (se cliente)
7. Zustand `authStore` salva `{ user, profile, role, clientId }`

### Redirecionamento pós-login

```ts
if (role === 'admin') router.push('/agency')
if (role === 'client') router.push('/client')
```

### Proteção de Rotas

```tsx
// ProtectedRoute.tsx
const { role } = useAuthStore()

if (!role) return <Navigate to="/login" />
if (requiredRole && role !== requiredRole) return <Navigate to="/unauthorized" />
```

### RBAC (Role-Based Access Control)

| Role | Acesso |
|---|---|
| `admin` | `/agency/*` — acesso total |
| `client` | `/client/*` — apenas dados do próprio `client_id` |

### Logout

```ts
await supabase.auth.signOut()
authStore.clear()
router.push('/login')
```

### Refresh de Sessão

- `supabase.auth.onAuthStateChange()` monitorado no `useAuth` hook
- Token renovado automaticamente pelo Supabase SDK

---

> **Observação:** Todo o controle de acesso a dados é reforçado via RLS no Supabase (ver `backend.md`). O frontend apenas reflete o que o banco autoriza.
