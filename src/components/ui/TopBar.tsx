import { useState, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSidebarStore } from "../../store/sidebarStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../services/supabase";
import { Bell, Menu, User, LogOut, Check, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export function TopBar() {
  const { toggle } = useSidebarStore();
  const { role } = useAuth();
  const { profile } = useAuthStore();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeClient, setActiveClient] = useState("all");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().clear();
    navigate("/login");
  };

  const pathNames = location.pathname.split("/").filter(x => x);
  
  const breadcrumbMap: Record<string, string> = {
    agency: "Agência",
    client: "Cliente",
    clients: "Clientes",
    calendar: "Calendário",
    tasks: "Tarefas",
    flows: "Fluxos",
    team: "Equipe",
    documents: "Documentos",
    reports: "Relatórios",
    onboarding: "Onboarding",
    traffic: "Tráfego Pago",
    social: "Social Media",
    web: "Web",
    approvals: "Aprovações",
    support: "Suporte",
    financial: "Financeiro",
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-slate-950 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 md:hidden"
          title="Alternar Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          {pathNames.map((value, index) => {
            const isLast = index === pathNames.length - 1;
            const title = breadcrumbMap[value] || value;
            
            return (
              <Fragment key={value}>
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <span className={cn(isLast ? "text-slate-900 dark:text-slate-100" : "")}>
                  {title.charAt(0).toUpperCase() + title.slice(1)}
                </span>
              </Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {role === "admin" && (
          <div className="hidden sm:block w-48">
            <Select value={activeClient} onValueChange={setActiveClient}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral (Todos)</SelectItem>
                <SelectItem value="client-1">Empresa Exemplo A</SelectItem>
                <SelectItem value="client-2">Empresa Exemplo B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {role === "client" && (
          <div className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
            {profile?.full_name || "Conta Cliente"}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary">
                  Marcar todas lidas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3 gap-1 cursor-default" onSelect={(e) => e.preventDefault()}>
                    <div className="flex w-full items-center justify-between">
                      <span className={cn("text-xs font-semibold", !notif.read_at && "text-primary")}>
                        {notif.title}
                      </span>
                      {!notif.read_at && (
                        <button onClick={() => markAsRead(notif.id)} className="text-slate-400 hover:text-slate-600" title="Marcar como lida">
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {notif.body && <p className="text-xs text-slate-500 line-clamp-2">{notif.body}</p>}
                    <span className="text-[10px] text-slate-400 mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  Nenhuma notificação no momento
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary/10 text-primary uppercase">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
