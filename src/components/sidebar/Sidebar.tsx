import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "../../store/sidebarStore";
import { useAuth } from "../../hooks/useAuth";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarItem } from "./SidebarItem";
import { NotificationBadge } from "./NotificationBadge";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, CheckSquare, GitBranch,
  FileText, BarChart2, Rocket, TrendingUp, Share2, Globe, ThumbsUp,
  MessageCircle, DollarSign, LogOut, Hexagon, ShieldCheck, Database
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../store/authStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  const { profile } = useAuthStore();
  const { isMobile } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    } finally {
      useAuthStore.getState().clear();
      navigate("/login", { replace: true });
    }
  };

  // on desktop, visually hide labels unless hovered, but on mobile always show labels inside the Sheet
  const textClasses = isMobile ? "block" : "hidden group-hover:block transition-all duration-200";


  const agencyItems = (
    <>
      <SidebarGroup label="Principal">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/agency" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Gestão">
        <SidebarItem icon={Users} label="Clientes" href="/agency/clients" onNavigate={onNavigate} />
        <SidebarItem icon={ShieldCheck} label="Acessos" href="/agency/access" onNavigate={onNavigate} />
        <SidebarItem icon={ThumbsUp} label="Aprovações" href="/agency/approvals" onNavigate={onNavigate} />
        <SidebarItem icon={DollarSign} label="Financeiro" href="/agency/financial" onNavigate={onNavigate} />
        <SidebarItem icon={UserCheck} label="Equipe" href="/agency/team" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Operacional">
        <SidebarItem icon={CalendarDays} label="Calendário" href="/agency/calendar" onNavigate={onNavigate} />
        <SidebarItem icon={CheckSquare} label="Tarefas" href="/agency/tasks" onNavigate={onNavigate} />
        <SidebarItem icon={GitBranch} label="Fluxos" href="/agency/flows" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Módulos">
        <SidebarItem icon={MessageCircle} label="Agente IA" href="/agency/ai-agent" onNavigate={onNavigate} />
        <SidebarItem icon={CheckSquare} label="Geral" href="/agency/general" onNavigate={onNavigate} />
        <SidebarItem icon={TrendingUp} label="Tráfego Pago" href="/agency/traffic" onNavigate={onNavigate} />
        <SidebarItem icon={Share2} label="Social Media" href="/agency/social" onNavigate={onNavigate} />
        <SidebarItem icon={Globe} label="Web" href="/agency/web" onNavigate={onNavigate} />
        <SidebarItem icon={Database} label="CRM e Tecnologia" href="/agency/crm" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Conteúdo">
        <SidebarItem icon={FileText} label="Documentos" href="/agency/documents" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Análise">
        <SidebarItem icon={BarChart2} label="Relatórios" href="/agency/reports" onNavigate={onNavigate} />
      </SidebarGroup>
    </>
  );

  const clientItems = (
    <>
      <SidebarGroup label="Principal">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/client" onNavigate={onNavigate} />
        <SidebarItem icon={CalendarDays} label="Calendário" href="/client/calendar" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Início">
        <SidebarItem 
          icon={Rocket} 
          label="Onboarding" 
          href="/client/onboarding" 
          endDecorator={<NotificationBadge type="task" />}
          onNavigate={onNavigate} 
        />
      </SidebarGroup>
      <SidebarGroup label="Módulos">
        <SidebarItem icon={CheckSquare} label="Geral" href="/client/general" onNavigate={onNavigate} />
        <SidebarItem icon={TrendingUp} label="Tráfego Pago" href="/client/traffic" onNavigate={onNavigate} />
        <SidebarItem icon={Share2} label="Social Media" href="/client/social" onNavigate={onNavigate} />
        <SidebarItem icon={Globe} label="Web" href="/client/web" onNavigate={onNavigate} />
        <SidebarItem icon={Database} label="CRM e Tecnologia" href="/client/crm" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Ações">
        <SidebarItem 
          icon={ThumbsUp} 
          label="Aprovações" 
          href="/client/approvals" 
          endDecorator={<NotificationBadge type="approval" />}
          onNavigate={onNavigate}
        />
      </SidebarGroup>
      <SidebarGroup label="Suporte">
        <div className="relative">
          <div className={cn(
            "absolute -top-2 left-8 z-10",
            "bg-primary text-[9px] font-bold text-primary-foreground px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider animate-pulse",
            !isMobile && "hidden group-hover:block"
          )}>
            Em Breve
          </div>
          <SidebarItem icon={MessageCircle} label="Suporte" href="/client/support" onNavigate={onNavigate} disabled />
        </div>
      </SidebarGroup>
      <SidebarGroup label="Financeiro">
        <SidebarItem icon={DollarSign} label="Financeiro" href="/client/financial" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Conteúdo">
        <SidebarItem icon={FileText} label="Documentos" href="/client/documents" onNavigate={onNavigate} />
      </SidebarGroup>
    </>
  );

  return (
    <>
      <div className="flex h-16 items-center border-b px-4 border-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <Hexagon className="h-8 w-8 shrink-0 text-primary" />
          <span className={cn("text-xl font-bold whitespace-nowrap", textClasses)}>CAEN</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(role === "admin" || role === "member") ? agencyItems : clientItems}
      </nav>

      <div className="border-t p-3 border-border">
        <div className={cn("flex flex-col sm:flex-row items-center", "justify-center group-hover:justify-between")}>
          <div className="flex items-center overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <span className="font-semibold text-foreground">
                {profile?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className={cn("ml-3 truncate", textClasses)}>
              <p className="truncate text-sm font-medium">{profile?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{(role === "admin" || role === "member") ? "Agência" : "Cliente"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={cn("rounded-md p-2 text-muted-foreground hover:bg-secondary shrink-0", 
              isMobile ? "ml-auto" : "mt-2 group-hover:mt-0 group-hover:ml-auto w-full group-hover:w-auto flex justify-center group-hover:justify-start"
            )}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isExpanded, isMobile, expand, collapse, setIsMobile } = useSidebarStore();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) collapse();
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile, collapse]);

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={isExpanded} onOpenChange={(open) => (open ? expand() : collapse())}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col bg-card border-r border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => collapse()} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar with CSS group hover expand
  // Note we removed `onMouseEnter` because we will rely purely on CSS hover.
  return (
    <aside
      className={cn(
        "group fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out border-border",
        "w-16 hover:w-60"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
