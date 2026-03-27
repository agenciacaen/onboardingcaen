import React from "react";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, change, changeLabel, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || changeLabel) && (
          <p className="flex items-center text-xs mt-1">
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center font-medium mr-1",
                  change > 0 ? "text-emerald-500" : change < 0 ? "text-red-500" : "text-slate-500"
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : change < 0 ? (
                  <TrendingDown className="mr-1 h-3 w-3" />
                ) : null}
                {Math.abs(change)}%
              </span>
            )}
            {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
