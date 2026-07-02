import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function AgencyClientTasksPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-orange-500" />
            Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)]">
            <KanbanBoard clientIdFilter={id || "all"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
