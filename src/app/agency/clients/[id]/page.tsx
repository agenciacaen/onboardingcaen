import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientEditModal } from "@/components/modals/ClientEditModal";
import { OnboardingRoadmap } from "@/modules/onboarding/components/OnboardingRoadmap";
import { AutomationService } from "@/services/automation.service";
import { useAuthStore } from "@/store/authStore";
import { UserCog, Rocket, Zap, Loader2, FileText } from "lucide-react";
import { ClientAccessTab } from "@/components/team/ClientAccessTab";
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";

import type { Task } from "@/types/general.types";
import type { ClientWithProfile } from "@/types/client.types";

export function AgencyClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [client, setClient] = useState<ClientWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  // Onboarding state
  const [onboardingTasks, setOnboardingTasks] = useState<Task[]>([]);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);
  const [initializingPhase1, setInitializingPhase1] = useState(false);
  const [generatingPhase2, setGeneratingPhase2] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        profiles!clients_assigned_to_fkey ( full_name, email )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao encontrar detalhes do cliente.");
      console.error(error);
    } else {
      setClient(data);
    }
    setLoading(false);
  }, [id]);

  const fetchOnboardingTasks = useCallback(async () => {
    if (!id) return;
    setLoadingOnboarding(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', id)
        .in('stage', ['onboarding_phase_1', 'onboarding_phase_2'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOnboardingTasks((data as Task[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas de onboarding:', err);
    } finally {
      setLoadingOnboarding(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        fetchClient();
        fetchOnboardingTasks();
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [fetchClient, fetchOnboardingTasks]);

  const handleInitializeOnboarding = async () => {
    if (!id || !user?.id) return;
    setInitializingPhase1(true);
    try {
      const { data: flows } = await supabase
        .from('flows')
        .select('id')
        .or('name.ilike.%Onboarding%,name.ilike.%Estratégia%')
        .limit(1);

      if (flows && flows.length > 0) {
        await AutomationService.executeFlow(flows[0].id, id, user.id);
        toast.success('Onboarding inicializado com sucesso!');
      } else {
        await AutomationService.initializeOnboarding(id, user.id);
        toast.success('Onboarding inicializado!');
      }

      await fetchOnboardingTasks();
      await fetchClient();
    } catch (error) {
      console.error('Erro ao inicializar onboarding:', error);
      toast.error('Erro ao inicializar onboarding.');
    } finally {
      setInitializingPhase1(false);
    }
  };

  const handleGeneratePhase2 = async () => {
    if (!id || !user?.id) return;
    setGeneratingPhase2(true);
    try {
      await AutomationService.generatePhase2(id, user.id);
      toast.success('Fase 2 gerada com sucesso!');
      await fetchOnboardingTasks();
    } catch (error) {
      console.error('Erro ao gerar Fase 2:', error);
      toast.error('Erro ao gerar Fase 2.');
    } finally {
      setGeneratingPhase2(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: string) => {
    setTogglingId(subtaskId);
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', subtaskId);

      if (error) throw error;

      setOnboardingTasks(prev =>
        prev.map(t =>
          t.id === subtaskId
            ? { ...t, status: newStatus as Task['status'], completed_at: newStatus === 'done' ? new Date().toISOString() : undefined }
            : t
        )
      );

      toast.success(newStatus === 'done' ? 'Item concluído!' : 'Item reaberto.');
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Não foi possível atualizar.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleImpersonate = () => {
    if (!id) return;
    useAuthStore.getState().setImpersonatedClientId(id);
    navigate('/client');
    toast.success(`Visualizando portal de ${client?.name}`);
  };

  if (loading) {
    return <LoadingSkeleton className="h-[400px] w-full" />;
  }

  if (!client) {
    return <div>Cliente não encontrado</div>;
  }

  const hasPhase1 = onboardingTasks.some(t => t.stage === 'onboarding_phase_1');
  const hasPhase2 = onboardingTasks.some(t => t.stage === 'onboarding_phase_2');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex flex-col gap-2">
            <PageHeader 
                title={client.name} 
                description={client.email}
            />
            <div className="flex">
                <StatusBadge status={client.status} />
            </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImpersonate}>Acessar Portal</Button>
          <Button onClick={() => setEditModalOpen(true)}>Editar Cliente</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="access">
             <UserCog className="w-4 h-4 mr-2" />
             Acessos
          </TabsTrigger>
          {client.modules_enabled.traffic && <TabsTrigger value="traffic">Tráfego</TabsTrigger>}
          {client.modules_enabled.social && <TabsTrigger value="social">Social</TabsTrigger>}
          {client.modules_enabled.web && <TabsTrigger value="web">Web</TabsTrigger>}
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="documents">
             <FileText className="w-4 h-4 mr-2" />
             Documentos
          </TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
           <ClientAccessTab clientId={id || ""} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="border rounded p-4 bg-muted/20">
            <h3 className="font-semibold text-lg mb-2">Dados Cadastrais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-sm">Razão Social</span>
                <span>{client.legal_name || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">CNPJ</span>
                <span>{client.cnpj || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">Telefone</span>
                <span>{client.phone || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">E-mail de Contato</span>
                <span>{client.email || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">Responsável Atual</span>
                <span>{client.profiles?.full_name || "Ninguém"}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={hasPhase1 ? "outline" : "default"}
              onClick={handleInitializeOnboarding}
              disabled={initializingPhase1}
              className={!hasPhase1 ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {initializingPhase1 ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              {hasPhase1 ? 'Reinicializar Fase 1' : 'Inicializar Onboarding'}
            </Button>

            {hasPhase1 && (
              <Button
                variant={hasPhase2 ? "outline" : "default"}
                onClick={handleGeneratePhase2}
                disabled={generatingPhase2}
                className={!hasPhase2 ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                {generatingPhase2 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {hasPhase2 ? 'Regenerar Fase 2' : 'Gerar Fase 2'}
              </Button>
            )}
          </div>

          {loadingOnboarding ? (
            <div className="flex items-center justify-center p-8 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : onboardingTasks.length > 0 ? (
            <OnboardingRoadmap
              tasks={onboardingTasks}
              onToggleSubtask={handleToggleSubtask}
              isToggling={togglingId}
            />
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Nenhum onboarding ativo. Clique no botão acima para inicializar.</p>
            </div>
          )}
        </TabsContent>

        {client.modules_enabled.traffic && <TabsContent value="traffic">Preview de Tráfego Aqui</TabsContent>}
        {client.modules_enabled.social && <TabsContent value="social">Preview Social Aqui</TabsContent>}
        {client.modules_enabled.web && <TabsContent value="web">Preview Web Aqui</TabsContent>}
        <TabsContent value="tasks">Listagem de tarefas vinculadas</TabsContent>
        <TabsContent value="documents" className="pt-4">
          <DocumentLibrary clientIdFilter={id || ""} />
        </TabsContent>
        <TabsContent value="financial">
          <div className="pt-4">
            <h3 className="font-semibold text-lg mb-4">Gestão Financeira do Cliente</h3>
            <p className="text-sm text-muted-foreground mb-4">Veja e gerencie as faturas e investimentos deste cliente.</p>
            <div className="bg-muted/10 rounded-xl border p-4 text-center">
               <p className="text-sm">Para gerenciar faturas, acesse o <Button variant="link" onClick={() => navigate('/agency/financial')}>Módulo Financeiro Geral</Button>.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ClientEditModal 
        client={client}
        open={isEditModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={fetchClient}
      />
    </div>
  );
}
