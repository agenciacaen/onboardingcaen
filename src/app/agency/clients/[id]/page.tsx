import { Outlet } from "react-router-dom";
import { ClientHeader } from "@/components/ui/ClientHeader";

export function AgencyClientDetailLayout() {
  return (
    <div className="flex flex-col h-full">
      <ClientHeader />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
