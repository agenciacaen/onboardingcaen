import React from "react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <Icon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 pb-2">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
