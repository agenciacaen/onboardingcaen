import { Skeleton } from "./skeleton";

export interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
  type?: "table" | "card" | "list";
  className?: string;
}

export function LoadingSkeleton({ rows = 3, cols = 3, type = "card", className }: LoadingSkeletonProps) {
  if (type === "card") {
    return (
      <div className={`grid gap-4 md:grid-cols-${Math.min(cols, 4)} ${className || ""}`}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 rounded-xl border p-4">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={`w-full ${className || ""}`}>
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-[250px]" />
        </div>
        <div className="rounded-md border">
          <div className="flex bg-muted/50 p-4 border-b">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className={`h-6 flex-1 mr-4 ${i === cols - 1 ? "mr-0" : ""}`} />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex p-4 border-b last:border-0">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className={`h-4 flex-1 mr-4 ${c === cols - 1 ? "mr-0" : ""}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
