import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "../../store/sidebarStore";
import { useAuth } from "../../hooks/useAuth";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarItem } from "./SidebarItem";
import { ApprovalBadgeCount } from "./ApprovalBadgeCount";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, CheckSquare, GitBranch,
  FileText, BarChart2, Rocket, TrendingUp, Share2, Globe, ThumbsUp,
  MessageCircle, DollarSign, LogOut, Hexagon
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
  const { isExpanded, isMobile } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().clear();
    navigate("/login");
  };

  const showLabels = isExpanded || isMobile;

  const agencyItems = (
    <>
      <SidebarGroup label="Principal">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/agency" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Gestão">
        <SidebarItem icon={Users} label="Clientes" href="/agency/clients" onNavigate={onNavigate} />
        <SidebarItem icon={UserCheck} label="Equipe" href="/agency/team" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Operacional">
        <SidebarItem icon={CalendarDays} label="Calendário" href="/agency/calendar" onNavigate={onNavigate} />
        <SidebarItem icon={CheckSquare} label="Tarefas" href="/agency/tasks" onNavigate={onNavigate} />
        <SidebarItem icon={GitBranch} label="Fluxos" href="/agency/flows" onNavigate={onNavigate} />
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
      </SidebarGroup>
      <SidebarGroup label="Início">
        <SidebarItem icon={Rocket} label="Onboarding" href="/client/onboarding" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Módulos">
        <SidebarItem icon={TrendingUp} label="Tráfego Pago" href="/client/traffic" onNavigate={onNavigate} />
        <SidebarItem icon={Share2} label="Social Media" href="/client/social" onNavigate={onNavigate} />
        <SidebarItem icon={Globe} label="Web" href="/client/web" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Ações">
        <SidebarItem 
          icon={ThumbsUp} 
          label="Aprovações" 
          href="/client/approvals" 
          endDecorator={<ApprovalBadgeCount />}
          onNavigate={onNavigate}
        />
      </SidebarGroup>
      <SidebarGroup label="Suporte">
        <SidebarItem icon={MessageCircle} label="Suporte" href="/client/support" onNavigate={onNavigate} />
      </SidebarGroup>
      <SidebarGroup label="Financeiro">
        <SidebarItem icon={DollarSign} label="Financeiro" href="/client/financial" onNavigate={onNavigate} />
      </SidebarGroup>
    </>
  );

  return (
    <>
      <div className="flex h-16 items-center border-b px-4 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <Hexagon className="h-8 w-8 shrink-0 text-primary" />
          {showLabels && <span className="text-xl font-bold whitespace-nowrap">CAEN</span>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {role === "admin" ? agencyItems : clientItems}
      </nav>

      <div className="border-t p-3 dark:border-slate-800">
        <div className={cn("flex items-center", showLabels ? "justify-between" : "justify-center")}>
          <div className="flex items-center overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {profile?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            {showLabels && (
              <div className="ml-3 truncate">
                <p className="truncate text-sm font-medium">{profile?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{role === "admin" ? "Agência" : "Cliente"}</p>
              </div>
            )}
          </div>
          {showLabels && (
            <button
              onClick={handleLogout}
              className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
        {!showLabels && (
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
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
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => collapse()} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar with hover expand
  return (
    <aside
      onMouseEnter={expand}
      onMouseLeave={collapse}
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r bg-white transition-all duration-300 ease-in-out dark:bg-slate-950 dark:border-slate-800",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
