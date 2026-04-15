import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';

import { AuthLayout } from './layouts/AuthLayout';
import { AgencyLayout } from './layouts/AgencyLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';

import { LoginPage } from './app/login/page';
import { UnauthorizedPage } from './app/unauthorized/page';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthLoadingScreen } from './components/ui/AuthLoadingScreen';

// Agência
import { AgencyDashboard } from './app/agency/page';
import { AgencyClientsPage } from './app/agency/clients/page';
import { AgencyClientDetailPage } from './app/agency/clients/[id]/page';
// AgencyCalendarPage removido - calendário agora é sub-item de Tarefas
import { AgencyTasksPage } from './app/agency/tasks/page';
import { AgencyFlowsPage } from './app/agency/flows/page';
import { AgencyTeamPage } from './app/agency/team/page';
import { AgencyApprovalsPage } from './app/agency/approvals/page';
import { AgencyDocumentsPage } from './app/agency/documents/page';
import { AgencyReportsPage } from './app/agency/reports/page';
import { AgencyFinancialPage } from './app/agency/financial/page';
import { AgencyAccessPage } from './app/agency/access/page';
import AgencySocialPage from './app/agency/social/page';
import AgencyTrafficPage from './app/agency/traffic/page';
import AgencyWebPage from './app/agency/web/page';
import AgencyCRMPage from './app/agency/crm/page';
// AgencyGeneralPage removido - módulo Geral eliminado
import AIAgentPage from './app/agency/ai-agent/page';

// Cliente
import { ClientDashboard } from './app/client/page';
import { ClientOnboardingPage } from './app/client/onboarding/page';
import { ClientTrafficPage } from './app/client/traffic/page';
import { ClientCampaignsPage } from './app/client/traffic/campaigns/page';
import { ClientCampaignDetailPage } from './app/client/traffic/campaigns/[id]/page';
import { ClientAdsPage } from './app/client/traffic/ads/page';
import { ClientSocialPage } from './app/client/social/page';
import { ClientWebPage } from './app/client/web/page';
import { ClientCRMPage } from './app/client/crm/page';
import { ClientApprovalsPage } from './app/client/approvals/page';
import { ClientSupportPage } from './app/client/support/page';
import { ClientTicketDetailPage } from './app/client/support/[ticketId]/page';
import { ClientFinancialPage } from './app/client/financial/page';
import { ClientDocumentsPage } from './app/client/documents/page';
// ClientGeneralPage e ClientCalendarPage removidos - módulos eliminados

function RootRedirect() {
  const { role, isLoading } = useAuth();
  
  if (isLoading) return <AuthLoadingScreen />; 
  
  if (role === 'admin' || role === 'member') return <Navigate to="/agency" replace />;
  if (role === 'client') return <Navigate to="/client" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { setUser, setProfile, finishLoading, clear } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança: se após 8s o auth ainda estiver em loading, forçar finalização
    const authTimeout = setTimeout(() => {
      if (mounted && useAuthStore.getState().isLoading) {
        console.warn('[Auth] Timeout de 8s atingido. Forçando finalização.');
        finishLoading();
      }
    }, 8000);

    const fetchProfile = async (userId: string) => {
      if (!mounted) return;
      console.log('[Auth] Buscando perfil para:', userId);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error('[Auth] Erro ao buscar perfil:', error);
          setProfile(null);
        } else {
          console.log('[Auth] Perfil carregado:', data?.role);
          setProfile(data);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[Auth] Erro inesperado ao buscar perfil:', err);
        setProfile(null);
      }
    };

    // Usamos APENAS onAuthStateChange como fonte única de verdade.
    // O evento INITIAL_SESSION é disparado imediatamente ao se inscrever,
    // contendo a sessão restaurada do localStorage (se existir).
    // Isso evita race conditions entre getSession() e onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('[Auth] Evento:', event, session?.user?.email || 'sem sessão');

      switch (event) {
        case 'INITIAL_SESSION': {
          // Sessão restaurada do localStorage no carregamento da página
          if (session?.user) {
            setUser(session.user);
            // Verificar se o profile já foi pré-populado pela LoginPage
            const existingProfile = useAuthStore.getState().profile;
            if (existingProfile && existingProfile.id === session.user.id) {
              console.log('[Auth] Perfil já existe no store, pulando fetch.');
              finishLoading();
            } else {
              await fetchProfile(session.user.id);
              if (mounted) finishLoading();
            }
          } else {
            console.log('[Auth] Nenhuma sessão encontrada no carregamento.');
            clear();
          }
          clearTimeout(authTimeout);
          break;
        }

        case 'SIGNED_IN': {
          if (session?.user) {
            setUser(session.user);
            // Verificar se o profile já foi setado pela LoginPage
            const existingProfile = useAuthStore.getState().profile;
            if (existingProfile && existingProfile.id === session.user.id) {
              console.log('[Auth] Profile já setado pela LoginPage.');
              finishLoading();
            } else {
              await fetchProfile(session.user.id);
              if (mounted) finishLoading();
            }
          }
          clearTimeout(authTimeout);
          break;
        }

        case 'SIGNED_OUT': {
          console.log('[Auth] Usuário deslogou.');
          clear();
          clearTimeout(authTimeout);
          break;
        }

        case 'TOKEN_REFRESHED': {
          // Apenas atualizar o user object, não mexer no profile
          if (session?.user) {
            setUser(session.user);
          }
          break;
        }

        default: {
          // USER_UPDATED, PASSWORD_RECOVERY, etc.
          if (session?.user) {
            setUser(session.user);
          }
          break;
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, finishLoading, clear]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AgencyLayout />}>
              <Route path="/agency" element={<AgencyDashboard />} />
              <Route path="/agency/clients" element={<AgencyClientsPage />} />
              <Route path="/agency/clients/:id" element={<AgencyClientDetailPage />} />
              {/* Calendário agora é sub-item de Tarefas (?tab=calendar) */}
              <Route path="/agency/approvals" element={<AgencyApprovalsPage />} />
              <Route path="/agency/tasks" element={<AgencyTasksPage />} />
              <Route path="/agency/flows" element={<AgencyFlowsPage />} />
              <Route path="/agency/team" element={<AgencyTeamPage />} />
               <Route path="/agency/documents" element={<AgencyDocumentsPage />} />
              <Route path="/agency/reports" element={<AgencyReportsPage />} />
              <Route path="/agency/financial" element={<AgencyFinancialPage />} />
              <Route path="/agency/access" element={<AgencyAccessPage />} />
              <Route path="/agency/social" element={<AgencySocialPage />} />
              <Route path="/agency/traffic" element={<AgencyTrafficPage />} />
              <Route path="/agency/web" element={<AgencyWebPage />} />
              <Route path="/agency/crm" element={<AgencyCRMPage />} />
              <Route path="/agency/ai-agent" element={<AIAgentPage />} />
              {/* Módulo Geral eliminado */}
            </Route>
          </Route>
          
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/onboarding" element={<ClientOnboardingPage />} />
              {/* Calendário do cliente eliminado - vive dentro de Social Media */}
              <Route path="/client/traffic" element={<ClientTrafficPage />} />
              <Route path="/client/traffic/campaigns" element={<ClientCampaignsPage />} />
              <Route path="/client/traffic/campaigns/:id" element={<ClientCampaignDetailPage />} />
              <Route path="/client/traffic/ads" element={<ClientAdsPage />} />
              <Route path="/client/social" element={<ClientSocialPage />} />
              <Route path="/client/web" element={<ClientWebPage />} />
              <Route path="/client/crm" element={<ClientCRMPage />} />
              <Route path="/client/approvals" element={<ClientApprovalsPage />} />
              <Route path="/client/support" element={<ClientSupportPage />} />
              <Route path="/client/support/:ticketId" element={<ClientTicketDetailPage />} />
              <Route path="/client/documents" element={<ClientDocumentsPage />} />
              <Route path="/client/financial" element={<ClientFinancialPage />} />
              {/* Módulo Geral do cliente eliminado */}
            </Route>
          </Route>
          
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
