import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function AgencyClientCRMPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            CRM & Tecnologia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)]">
            <KanbanBoard clientIdFilter={id || "all"} moduleFilter="crm" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
