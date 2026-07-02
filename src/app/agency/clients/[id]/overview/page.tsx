import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { toast } from "sonner";
import {
  Activity, TrendingUp, Share2, Globe, Database, DollarSign,
  User, Building2, ArrowRight
} from "lucide-react";
import type { ClientWithProfile } from "@/types/client.types";

export default function AgencyClientOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAmount, setPendingAmount] = useState(0);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSkeleton className="h-[400px] w-full" />;
  if (!client) return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado</div>;

  const activeModules = Object.entries(client.modules_enabled)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  const moduleInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    traffic: { label: "Tráfego Pago", icon: <TrendingUp className="h-5 w-5" />, color: "text-blue-500 bg-blue-500/10" },
    social: { label: "Social Media", icon: <Share2 className="h-5 w-5" />, color: "text-pink-500 bg-pink-500/10" },
    web: { label: "Web", icon: <Globe className="h-5 w-5" />, color: "text-emerald-500 bg-emerald-500/10" },
    crm: { label: "CRM & Tech", icon: <Database className="h-5 w-5" />, color: "text-purple-500 bg-purple-500/10" },
  };

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
              <p className="text-lg font-bold">{activeModules.length}</p>
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
          <CardTitle className="text-lg">Resumo dos Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeModules.map((key) => {
              const info = moduleInfo[key];
              if (!info) return null;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/agency/clients/${id}/${key}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${info.color}`}>
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{info.label}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
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
