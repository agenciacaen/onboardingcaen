import React from "react";
import { useSidebarStore } from "../../store/sidebarStore";
import { cn } from "../../lib/utils";

export interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  const { isMobile } = useSidebarStore();
  const isDesktop = !isMobile;

  return (
    <div className="mb-4">
      {isDesktop ? (
        <>
          <h4 className="mb-1 hidden px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:block dark:text-slate-400">
            {label}
          </h4>
          <div className="mb-1 h-4 w-full flex items-center justify-center group-hover:hidden">
            <div className="w-6 border-b border-slate-200 dark:border-slate-800" />
          </div>
        </>
      ) : (
        <h4 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </h4>
      )}
      <div className={cn("space-y-1", isDesktop && "flex flex-col items-center group-hover:block")}>
        {children}
      </div>
    </div>
  );
}
