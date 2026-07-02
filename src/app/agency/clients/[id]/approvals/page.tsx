import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";

export default function AgencyClientApprovalsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            Aprovações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)]">
            <KanbanBoard clientIdFilter={id || "all"} moduleFilter="approvals" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
