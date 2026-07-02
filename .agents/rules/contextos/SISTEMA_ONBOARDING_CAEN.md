# Sistema ONBOARDING - CAEN

## Visão Geral

Plataforma web de gestão para agências de marketing digital, construída com **React 19 + TypeScript + Vite + Supabase**. O sistema oferece dois portais distintos — **Agência** e **Cliente** — cada um com módulos específicos para gerenciamento de campanhas, relacionamento, financeiro, suporte e muito mais.

---

## Stack Tecnológica

| Tecnologia | Finalidade |
|---|---|
| React 19 | Framework front-end |
| TypeScript 5.9 | Tipagem estática |
| Vite 8 | Bundler e servidor de desenvolvimento |
| Tailwind CSS 3 | Estilização utilitária |
| Supabase | Backend completo: autenticação, banco PostgreSQL, RLS, serverless functions |
| React Router DOM 7 | Roteamento SPA |
| Zustand | Gerenciamento de estado global |
| React Hook Form + Zod | Formulários e validação |
| TanStack Table | Tabelas de dados robustas |
| Recharts | Gráficos e analytics |
| Radix UI | Componentes acessíveis (Dialog, Dropdown, Select, Tabs, Tooltip, etc.) |
| Sonner | Notificações toast |
| date-fns | Manipulação de datas |
| Lucide React | Iconografia |
| Next Themes | Suporte a temas dark/light |

---

## Autenticação e Controle de Acesso

- Autenticação gerenciada pelo **Supabase Auth**
- Três roles de usuário: **admin**, **member** (agência) e **client**
- Sessão restaurada automaticamente via `onAuthStateChange`
- Timeout de segurança de 8 segundos no carregamento de autenticação
- Perfis armazenados na tabela `profiles` do PostgreSQL
- **Row Level Security (RLS)** no banco com políticas específicas para cada role
- Proteção de rotas via componente `<ProtectedRoute>` com verificação de role

---

## Integrações Externas

- **Meta Ads API** — contas de anúncio, campanhas e métricas de tráfego pago
- Fontes de dados suportadas: `manual`, `meta`, `google`, `tiktok`

---

## Portal da Agência (`/agency`)

Destinado a administradores e membros da agência para gestão completa dos clientes e operações.

| Módulo | Finalidade |
|---|---|
| **Dashboard** | Visão geral com indicadores, métricas e resumo operacional |
| **Clientes** | Cadastro, listagem e detalhamento de clientes da agência |
| **Tarefas** | Gestão de tarefas internas, com calendário integrado |
| **Fluxos** | Automação de processos e fluxos de trabalho |
| **Equipe** | Gestão da equipe interna da agência |
| **Aprovações** | Fluxo de aprovação de peças, campanhas e conteúdos |
| **Documentos** | Repositório e gestão de documentos |
| **Relatórios** | Geração de relatórios gerenciais e analíticos |
| **Financeiro** | Gestão financeira: cobranças, contratos e faturamento |
| **Acesso** | Controle de permissões e acesso ao sistema |
| **Redes Sociais** | Gestão de conteúdo e publicação em redes sociais |
| **Tráfego** | Gestão de campanhas de mídia paga (Meta Ads, Google, TikTok) |
| **Web** | Gestão de sites, landing pages e presença digital |
| **CRM** | Gestão de relacionamento com clientes e leads |
| **Agente IA** | Assistente com inteligência artificial |
| **Suporte** | Sistema de tickets de suporte aos clientes |

---

## Portal do Cliente (`/client`)

Destinado aos clientes da agência para acompanhamento dos serviços contratados.

| Módulo | Finalidade |
|---|---|
| **Dashboard** | Visão geral com indicadores de desempenho dos serviços |
| **Onboarding** | Processo de integração e boas-vindas ao cliente |
| **Tráfego** | Acompanhamento de campanhas de tráfego pago |
| **Redes Sociais** | Visualização de conteúdo e métricas de redes sociais |
| **Web** | Acompanhamento de projetos web |
| **CRM** | Relacionamento com a agência |
| **Aprovações** | Aprovação de peças, artes e campanhas |
| **Suporte** | Abertura e acompanhamento de tickets de suporte |
| **Documentos** | Acesso a documentos compartilhados pela agência |
| **Financeiro** | Visualização de informações financeiras e pagamentos |

---

## Estrutura de Código

```
src/
  app/              — Páginas organizadas por módulo (agency/ e client/)
  components/       — Componentes reutilizáveis (ui, sidebar, cards, charts, etc.)
  hooks/            — Hooks customizados (useAuth)
  layouts/          — Layouts por role (AuthLayout, AgencyLayout, ClientLayout)
  lib/              — Utilitários gerais
  modules/          — Lógica de negócio por domínio (approvals, onboarding, social, etc.)
  services/         — Camada de serviço (Supabase, Social, Web, Automation, Notification)
  store/            — Stores globais Zustand (auth, notification, sidebar)
  types/            — Definições TypeScript
```

---

## Banco de Dados (Supabase PostgreSQL)

Principais tabelas:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de usuário vinculados ao `auth.users` |
| `clients` | Dados cadastrais dos clientes |
| `traffic_campaigns` | Campanhas de tráfego pago |
| `meta_ad_accounts` | Contas conectadas do Meta Ads |
| Diversas tabelas por módulo | Aprovações, documentos, tickets, tarefas, etc. |

Segurança: **RLS (Row Level Security)** habilitado com políticas granulares por role e por usuário.

---

## Funcionalidades Técnicas Relevantes

- Tema **dark/light** com detecção automática do sistema
- **Error Boundary** para captura de erros no React
- Notificações **toast** com o Sonner
- Gerenciamento de estado previsível com **Zustand**
- Formulários reativos com validação **Zod**
- Sidebar adaptativa por role
- Componentes **acessíveis** via Radix UI
