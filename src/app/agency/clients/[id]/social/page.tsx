import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function AgencyClientSocialPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-pink-500" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)]">
            <KanbanBoard clientIdFilter={id || "all"} moduleFilter="social" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
