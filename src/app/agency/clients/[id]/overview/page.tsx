import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Activity, DollarSign, User, Building2, Rocket, Loader2,
  CheckCircle2, Circle, ArrowRight
} from "lucide-react";
import type { ClientWithProfile } from "@/types/client.types";
import type { Task } from "@/types/general.types";

export default function AgencyClientOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [onboardingTasks, setOnboardingTasks] = useState<Task[]>([]);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: clientData, error } = await supabase
      .from("clients")
      .select(`
        *,
        profiles!clients_assigned_to_fkey ( full_name, email )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar cliente.");
      console.error(error);
      setLoading(false);
      return;
    }

    setClient(clientData);

    const { data: finData } = await supabase
      .from("financial_invoices")
      .select("amount")
      .eq("client_id", id)
      .eq("status", "pending");

    if (finData) {
      setPendingAmount(finData.reduce((sum, f) => sum + (f.amount || 0), 0));
    }

    setLoading(false);
  }, [id]);

  const fetchOnboardingTasks = useCallback(async () => {
    if (!id) return;
    setLoadingOnboarding(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', id)
      .in('stage', ['onboarding_phase_1', 'onboarding_phase_2'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOnboardingTasks(data as Task[]);
    }
    setLoadingOnboarding(false);
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchOnboardingTasks();
  }, [fetchData, fetchOnboardingTasks]);

  if (loading) return <LoadingSkeleton className="h-[400px] w-full" />;
  if (!client) return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado</div>;

  const activeModules = Object.entries(client.modules_enabled)
    .filter(([, enabled]) => enabled)
    .length;

  const totalOnboarding = onboardingTasks.length;
  const doneOnboarding = onboardingTasks.filter(t => t.status === 'done').length;
  const onboardingProgress = totalOnboarding > 0 ? Math.round((doneOnboarding / totalOnboarding) * 100) : 0;
  const isOnboardingComplete = client.onboarding_completed;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={client.status} className="mt-0.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Módulos Ativos</p>
              <p className="text-lg font-bold">{activeModules}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className={`text-lg font-bold ${pendingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <User className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="text-sm font-medium truncate">{client.profiles?.full_name || "Não atribuído"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-500" />
            Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOnboarding ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : totalOnboarding === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum onboarding iniciado.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate(`/agency/clients/${id}/onboarding`)}
              >
                Iniciar Onboarding
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOnboardingComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isOnboardingComplete ? "Onboarding concluído" : `${doneOnboarding} de ${totalOnboarding} etapas concluídas`}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-500">{onboardingProgress}%</span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${isOnboardingComplete ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${onboardingProgress}%` }}
                />
              </div>

              <div className="space-y-1.5">
                {onboardingTasks.filter(t => t.status !== 'done').slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Circle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {onboardingTasks.filter(t => t.status !== 'done').length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{onboardingTasks.filter(t => t.status !== 'done').length - 5} etapas restantes
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => navigate(`/agency/clients/${id}/onboarding`)}
              >
                Ver Onboarding
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Razão Social</span>
              <span className="text-sm font-medium">{client.legal_name || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">CNPJ</span>
              <span className="text-sm font-medium">{client.cnpj || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Telefone</span>
              <span className="text-sm font-medium">{client.phone || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">E-mail</span>
              <span className="text-sm font-medium">{client.email || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Criado em</span>
              <span className="text-sm font-medium">{new Date(client.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
