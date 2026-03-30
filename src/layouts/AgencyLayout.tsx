import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar/Sidebar";
import { TopBar } from "../components/ui/TopBar";
export function AgencyLayout() {
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out w-full md:ml-16 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
