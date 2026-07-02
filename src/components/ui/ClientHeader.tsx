import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2, LayoutDashboard, Rocket, TrendingUp, Share2,
  Globe, Database, ThumbsUp, CheckSquare, FileText,
  DollarSign, MessageCircle, ShieldCheck, ArrowRight,
  Pencil
} from "lucide-react";
import type { Client } from "@/types/client.types";

interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  condition: (modules: Client['modules_enabled']) => boolean;
}

const navTabs: NavTab[] = [
  { key: "overview", label: "Overview", href: "", icon: <LayoutDashboard className="h-4 w-4" />, condition: () => true },
  { key: "onboarding", label: "Onboarding", href: "/onboarding", icon: <Rocket className="h-4 w-4" />, condition: () => true },
  { key: "traffic", label: "Tráfego", href: "/traffic", icon: <TrendingUp className="h-4 w-4" />, condition: (m) => m.traffic },
  { key: "social", label: "Social", href: "/social", icon: <Share2 className="h-4 w-4" />, condition: (m) => m.social },
  { key: "web", label: "Web", href: "/web", icon: <Globe className="h-4 w-4" />, condition: (m) => m.web },
  { key: "crm", label: "CRM", href: "/crm", icon: <Database className="h-4 w-4" />, condition: (m) => m.crm },
  { key: "approvals", label: "Aprovações", href: "/approvals", icon: <ThumbsUp className="h-4 w-4" />, condition: (m) => m.approvals },
  { key: "tasks", label: "Tarefas", href: "/tasks", icon: <CheckSquare className="h-4 w-4" />, condition: () => true },
  { key: "documents", label: "Documentos", href: "/documents", icon: <FileText className="h-4 w-4" />, condition: (m) => m.documents },
  { key: "financial", label: "Financeiro", href: "/financial", icon: <DollarSign className="h-4 w-4" />, condition: (m) => m.financial },
  { key: "support", label: "Suporte", href: "/support", icon: <MessageCircle className="h-4 w-4" />, condition: (m) => m.support },
  { key: "access", label: "Acessos", href: "/access", icon: <ShieldCheck className="h-4 w-4" />, condition: () => true },
];

export function ClientHeader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState<Client | null>(null);

  const currentPath = location.pathname;
  const basePath = `/agency/clients/${id}`;
  const currentTabKey = currentPath.replace(basePath, "").split("/")[1] || "overview";

  const fetchClient = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar dados do cliente.");
      console.error(error);
    } else {
      setClient(data);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleImpersonate = () => {
    if (!id) return;
    useAuthStore.getState().setImpersonatedClientId(id);
    navigate('/client');
    toast.success(`Visualizando portal de ${client?.name}`);
  };

  if (!client) return null;

  const visibleTabs = navTabs.filter(tab => tab.condition(client.modules_enabled));

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold truncate">{client.name}</h2>
              <StatusBadge status={client.status} className="shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleImpersonate} className="gap-1.5">
            Acessar Portal
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}?edit=true`)} title="Editar Cliente">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="flex items-center gap-1 px-4 md:px-6 pb-0 overflow-x-auto scrollbar-none">
        {visibleTabs.map((tab) => {
          const isActive = currentTabKey === tab.key;
          return (
            <Link
              key={tab.key}
              to={`${basePath}${tab.href}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
