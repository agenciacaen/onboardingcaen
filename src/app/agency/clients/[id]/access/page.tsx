import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAccessTab } from "@/components/team/ClientAccessTab";
import { ShieldCheck } from "lucide-react";

export default function AgencyClientAccessPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-500" />
            Acessos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientAccessTab clientId={id || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
