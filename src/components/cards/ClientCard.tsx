import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Share2, Globe, Database, ThumbsUp,
  DollarSign, FileText, MessageCircle, ArrowRight,
  Building2, User
} from "lucide-react";
import type { ClientWithProfile } from "@/types/client.types";

const moduleIcons: Record<string, React.ReactNode> = {
  traffic: <TrendingUp className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />,
  crm: <Database className="h-4 w-4" />,
  approvals: <ThumbsUp className="h-4 w-4" />,
  financial: <DollarSign className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  support: <MessageCircle className="h-4 w-4" />,
};

const moduleLabels: Record<string, string> = {
  traffic: "Tráfego",
  social: "Social",
  web: "Web",
  crm: "CRM",
  approvals: "Aprovações",
  financial: "Financeiro",
  documents: "Docs",
  support: "Suporte",
};

interface ClientCardProps {
  client: ClientWithProfile;
  pendingAmount: number;
}

export function ClientCard({ client, pendingAmount }: ClientCardProps) {
  const activeModules = Object.entries(client.modules_enabled)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{client.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
            </div>
          </div>
          <StatusBadge status={client.status} className="shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {activeModules.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
              title={moduleLabels[key]}
            >
              {moduleIcons[key]}
              <span className="hidden sm:inline">{moduleLabels[key]}</span>
            </span>
          ))}
          {activeModules.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Nenhum módulo ativo</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{client.profiles?.full_name || "Não atribuído"}</span>
        </div>

        {pendingAmount > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingAmount)} pendente
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 pb-4 pt-0">
        <Button variant="default" size="sm" className="w-full gap-2" asChild>
          <Link to={`/agency/clients/${client.id}`}>
            Ver Cliente
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
