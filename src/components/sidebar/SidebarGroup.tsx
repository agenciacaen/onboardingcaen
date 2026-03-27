import React from "react";
import { useSidebarStore } from "../../store/sidebarStore";
import { cn } from "../../lib/utils";

export interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  const { isExpanded } = useSidebarStore();

  return (
    <div className="mb-4">
      {isExpanded && (
        <h4 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </h4>
      )}
      {!isExpanded && (
        <div className="mb-1 h-4 w-full flex items-center justify-center">
          <div className="w-6 border-b border-slate-200 dark:border-slate-800" />
        </div>
      )}
      <div className={cn("space-y-1", !isExpanded && "flex flex-col items-center")}>
        {children}
      </div>
    </div>
  );
}
