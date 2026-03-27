import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar/Sidebar";
import { TopBar } from "../components/ui/TopBar";
import { useSidebarStore } from "../store/sidebarStore";
import { cn } from "../lib/utils";

export function ClientLayout() {
  const { isExpanded } = useSidebarStore();
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out w-full",
          isExpanded ? "md:max-w-[calc(100%-240px)] md:ml-60" : "md:max-w-[calc(100%-64px)] md:ml-16"
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
