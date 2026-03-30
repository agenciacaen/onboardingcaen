import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';

import { AuthLayout } from './layouts/AuthLayout';
import { AgencyLayout } from './layouts/AgencyLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './app/login/page';
import { UnauthorizedPage } from './app/unauthorized/page';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthLoadingScreen } from './components/ui/AuthLoadingScreen';

// Agência
import { AgencyDashboard } from './app/agency/page';
import { AgencyClientsPage } from './app/agency/clients/page';
import { AgencyClientDetailPage } from './app/agency/clients/[id]/page';
import { AgencyCalendarPage } from './app/agency/calendar/page';
import { AgencyTasksPage } from './app/agency/tasks/page';
import { AgencyFlowsPage } from './app/agency/flows/page';
import { AgencyTeamPage } from './app/agency/team/page';
import { AgencyApprovalsPage } from './app/agency/approvals/page';
import { AgencyDocumentsPage } from './app/agency/documents/page';
import { AgencyReportsPage } from './app/agency/reports/page';
import { AgencyFinancialPage } from './app/agency/financial/page';

// Cliente
import { ClientDashboard } from './app/client/page';
import { ClientOnboardingPage } from './app/client/onboarding/page';
import { ClientTrafficPage } from './app/client/traffic/page';
import { ClientCampaignsPage } from './app/client/traffic/campaigns/page';
import { ClientCampaignDetailPage } from './app/client/traffic/campaigns/[id]/page';
import { ClientAdsPage } from './app/client/traffic/ads/page';
import { ClientSocialPage } from './app/client/social/page';
import { ClientWebPage } from './app/client/web/page';
import { ClientApprovalsPage } from './app/client/approvals/page';
import { ClientSupportPage } from './app/client/support/page';
import { ClientTicketDetailPage } from './app/client/support/[ticketId]/page';
import { ClientFinancialPage } from './app/client/financial/page';

function RootRedirect() {
  const { role, isLoading } = useAuth();
  
  if (isLoading) return <AuthLoadingScreen />; 
  
  if (role === 'admin' || role === 'member') return <Navigate to="/agency" replace />;
  if (role === 'client') return <Navigate to="/client" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { setUser, setProfile, setLoading, finishLoading, clear } = useAuthStore();

  useEffect(() => {
    async function getProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        setProfile(null);
      } finally {
        finishLoading();
      }
    }

    // Inicia loading — o onAuthStateChange vai disparar INITIAL_SESSION automaticamente
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (session?.user) {
        setUser(session.user);
        // Se o LoginPage já populou o store, não busca de novo
        const currentProfile = useAuthStore.getState().profile;
        if (!currentProfile || currentProfile.id !== session.user.id) {
          await getProfile(session.user.id);
        } else {
          finishLoading();
        }
      } else {
        clear();
        finishLoading();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading, finishLoading, clear]);

  return (
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
              <Route path="/agency/calendar" element={<AgencyCalendarPage />} />
              <Route path="/agency/approvals" element={<AgencyApprovalsPage />} />
              <Route path="/agency/tasks" element={<AgencyTasksPage />} />
              <Route path="/agency/flows" element={<AgencyFlowsPage />} />
              <Route path="/agency/team" element={<AgencyTeamPage />} />
              <Route path="/agency/documents" element={<AgencyDocumentsPage />} />
              <Route path="/agency/reports" element={<AgencyReportsPage />} />
              <Route path="/agency/financial" element={<AgencyFinancialPage />} />
            </Route>
          </Route>
          
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/onboarding" element={<ClientOnboardingPage />} />
              <Route path="/client/traffic" element={<ClientTrafficPage />} />
              <Route path="/client/traffic/campaigns" element={<ClientCampaignsPage />} />
              <Route path="/client/traffic/campaigns/:id" element={<ClientCampaignDetailPage />} />
              <Route path="/client/traffic/ads" element={<ClientAdsPage />} />
              <Route path="/client/social" element={<ClientSocialPage />} />
              <Route path="/client/web" element={<ClientWebPage />} />
              <Route path="/client/approvals" element={<ClientApprovalsPage />} />
              <Route path="/client/support" element={<ClientSupportPage />} />
              <Route path="/client/support/:ticketId" element={<ClientTicketDetailPage />} />
              <Route path="/client/financial" element={<ClientFinancialPage />} />
            </Route>
          </Route>
          
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
