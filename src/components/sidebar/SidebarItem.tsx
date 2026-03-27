import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useSidebarStore } from "../../store/sidebarStore";

export interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  endDecorator?: React.ReactNode;
  onNavigate?: () => void;
}

export function SidebarItem({ icon: Icon, label, href, isActive, endDecorator, onNavigate }: SidebarItemProps) {
  const { isExpanded, isMobile } = useSidebarStore();
  const location = useLocation();
  
  const showLabels = isExpanded || isMobile;

  const isCurrentlyActive = isActive !== undefined 
    ? isActive 
    : (href === "/agency" && location.pathname === "/agency") || 
      (href === "/client" && location.pathname === "/client") ||
      (href !== "/agency" && href !== "/client" && location.pathname.startsWith(href));

  return (
    <NavLink
      to={href}
      onClick={() => onNavigate?.()}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1 whitespace-nowrap overflow-hidden",
        isCurrentlyActive 
          ? "bg-primary/10 text-primary" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        !showLabels && "justify-center px-2"
      )}
      title={!showLabels ? label : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0", showLabels && "mr-3")} />
      {showLabels && <span className="flex-1 text-left truncate">{label}</span>}
      {showLabels && endDecorator}
    </NavLink>
  );
}
