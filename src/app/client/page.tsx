import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Share2,
  ThumbsUp,
  Globe,
  CheckSquare,
  Bell,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  campaigns_active: number;
  spend: number;
  posts_published: number;
  pending_approvals: number;
  active_web_pages: number;
  open_tasks: number;
  unread_notifications: number;
  // Novos campos financeiros
  ads_investment: number;
  labor_investment: number;
  total_pending: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
  description?: string;
  variant?: "default" | "accent" | "warning";
}) {
  const navigate = useNavigate();
  const bgMap = {
    default: "bg-primary/10 text-primary",
    accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 ${
        href ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
      onClick={() => href && navigate(href)}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgMap[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              {description}
            </p>
          )}
        </div>
        {href && (
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}

export function ClientDashboard() {
  const { clientId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!clientId) return;

      try {
        setLoading(true);
        
        // Buscamos os dados base e as faturas em paralelo
        const [baseDataRes, invoicesRes, campaignsRes, tasksRes, approvalsRes, notifsRes] = await Promise.all([
          supabase.rpc("get_client_dashboard", { p_client_id: clientId }),
          supabase.from('financial_invoices').select('amount, category, status, due_date').eq('client_id', clientId),
          supabase.from('traffic_campaigns').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active'),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['todo', 'in_progress', 'review']),
          supabase.from('social_approvals').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'pending'),
          supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
        ]);

        // Processamento financeiro
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        const financial = (invoicesRes.data || []).reduce((acc, inv) => {
          const date = new Date(inv.due_date);
          const isCurrent = date.getMonth() === curMonth && date.getFullYear() === curYear;
          
          if (isCurrent) {
            if (inv.category === 'ads') acc.ads += inv.amount;
            if (inv.category === 'labor') acc.labor += inv.amount;
          }
          if (inv.status !== 'paid') acc.pending += inv.amount;
          return acc;
        }, { ads: 0, labor: 0, pending: 0 });

        // Dados do RPC (se disponível)
        const rpcData = baseDataRes.data ? (typeof baseDataRes.data === 'string' ? JSON.parse(baseDataRes.data) : baseDataRes.data) : {};

        setData({
          campaigns_active: campaignsRes.count || rpcData.campaigns_active || 0,
          spend: financial.ads || rpcData.spend || 0,
          posts_published: rpcData.posts_published || 0,
          pending_approvals: approvalsRes.count || rpcData.pending_approvals || 0,
          active_web_pages: rpcData.active_web_pages || 0,
          open_tasks: tasksRes.count || rpcData.open_tasks || 0,
          unread_notifications: notifsRes.count || rpcData.unread_notifications || 0,
          ads_investment: financial.ads,
          labor_investment: financial.labor,
          total_pending: financial.pending,
        });

      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        toast.error("Erro ao carregar alguns dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Visão geral do seu projeto de marketing digital."
        />
        <LoadingSkeleton type="card" rows={1} cols={4} />
        <LoadingSkeleton type="card" rows={1} cols={3} />
      </div>
    );
  }

  const stats = data || {
    campaigns_active: 0,
    spend: 0,
    posts_published: 0,
    pending_approvals: 0,
    active_web_pages: 0,
    open_tasks: 0,
    unread_notifications: 0,
    ads_investment: 0,
    labor_investment: 0,
    total_pending: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Dashboard"
          description="Visão geral do seu projeto de marketing digital."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Campanhas Ativas"
          value={stats.campaigns_active}
          icon={TrendingUp}
          href="/client/traffic"
        />
        <StatCard
          title="Investimentos (Mês)"
          value={`R$ ${stats.ads_investment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Total investido em anúncios ↗"
          icon={TrendingUp}
          href="/client/financial"
          variant="default"
        />
        <StatCard
          title="Mão de Obra (Mês)"
          value={`R$ ${stats.labor_investment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Faturamento em serviços"
          icon={Wallet}
          href="/client/financial"
          variant="default"
        />
        <StatCard
          title="Total Pendente"
          value={`R$ ${stats.total_pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Aguardando pagamento"
          icon={DollarSign}
          href="/client/financial"
          variant="warning"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Páginas Web Ativas"
          value={stats.active_web_pages}
          icon={Globe}
          href="/client/web"
        />
        <StatCard
          title="Tarefas em Aberto"
          value={stats.open_tasks}
          icon={CheckSquare}
        />
        <StatCard
          title="Notificações Não Lidas"
          value={stats.unread_notifications}
          icon={Bell}
          variant={stats.unread_notifications > 0 ? "warning" : "default"}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/client/approvals">
              <ThumbsUp className="h-4 w-4" />
              Ver Aprovações
            </a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/client/traffic">
              <TrendingUp className="h-4 w-4" />
              Ver Campanhas
            </a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/client/social">
              <Share2 className="h-4 w-4" />
              Ver Social Media
            </a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/client/support">
              <Bell className="h-4 w-4" />
              Abrir Suporte
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
