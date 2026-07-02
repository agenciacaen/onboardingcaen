import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function AgencyClientTrafficPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Tráfego Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)]">
            <KanbanBoard clientIdFilter={id || "all"} moduleFilter="traffic" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
