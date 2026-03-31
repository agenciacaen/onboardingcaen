import { useAuth } from "@/hooks/useAuth";
import { MonthlyCalendarView } from "@/components/calendar/MonthlyCalendarView";
import { PageHeader } from "@/components/ui/PageHeader";

export function ClientCalendarPage() {
  const { user } = useAuth();
  const clientId = user?.id; // O ID do usuário cliente é o próprio client_id no nosso sistema (ou vinculado a um)

  /* 
     Nota: No sistema atual, o perfil do cliente tem o mesmo ID do 'client_id' 
     ou o client_id está associado ao user.id. 
     Vamos garantir que passamos o filtro correto.
  */

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Meu Calendário" 
        description="Acompanhe o cronograma de postagens, reuniões e prazos de entrega."
      />

      <MonthlyCalendarView clientIdFilter={clientId} />
    </div>
  );
}
