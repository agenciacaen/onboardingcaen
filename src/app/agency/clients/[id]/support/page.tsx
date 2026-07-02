import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Ticket } from "lucide-react";

export default function AgencyClientSupportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Histórico de tickets de suporte deste cliente.</p>
          <Button onClick={() => navigate(`/agency/support?clientId=${id}`)} className="gap-2">
            <Ticket className="h-4 w-4" />
            Ver Tickets no Módulo de Suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
