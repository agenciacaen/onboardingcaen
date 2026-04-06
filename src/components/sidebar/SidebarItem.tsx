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
  disabled?: boolean;
}

export function SidebarItem({ icon: Icon, label, href, isActive, endDecorator, onNavigate, disabled }: SidebarItemProps) {
  const { isMobile } = useSidebarStore();
  const location = useLocation();
  
  const isDesktop = !isMobile;

  const isCurrentlyActive = isActive !== undefined 
    ? isActive 
    : (href === "/agency" && location.pathname === "/agency") || 
      (href === "/client" && location.pathname === "/client") ||
      (href !== "/agency" && href !== "/client" && location.pathname.startsWith(href));

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium mb-1 whitespace-nowrap overflow-hidden transition-all duration-300",
          "text-muted-foreground opacity-60 cursor-not-allowed select-none",
          isDesktop && "justify-center px-2 group-hover:justify-start group-hover:px-3"
        )}
        title={isDesktop ? `${label} (Em breve)` : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0 transition-all", isDesktop ? "group-hover:mr-3" : "mr-3")} />
        <span className={cn("flex-1 text-left truncate transition-all duration-300", isDesktop && "hidden group-hover:block")}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={href}
      onClick={() => onNavigate?.()}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1 whitespace-nowrap overflow-hidden transition-all duration-300",
        isCurrentlyActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isDesktop && "justify-center px-2 group-hover:justify-start group-hover:px-3"
      )}
      title={isDesktop ? label : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0 transition-all", isDesktop ? "group-hover:mr-3" : "mr-3")} />
      <span className={cn("flex-1 text-left truncate transition-all duration-300", isDesktop && "hidden group-hover:block")}>
        {label}
      </span>
      {endDecorator && (
        <div className={cn(isDesktop && "hidden group-hover:block")}>
          {endDecorator}
        </div>
      )}
    </NavLink>
  );
}
