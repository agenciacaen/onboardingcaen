import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowRight } from "lucide-react";
import { FinancialKanban } from "@/components/kanban/FinancialKanban";

export default function AgencyClientFinancialPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Gestão Financeira
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/agency/financial')} className="gap-1.5">
            Módulo Geral
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <FinancialKanban clientId={id || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
