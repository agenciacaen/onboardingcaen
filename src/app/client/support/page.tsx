import { PageHeader } from '../../../components/ui/PageHeader';
import { SupportTicketList } from '../../../modules/support/components/SupportTicketList';

export function ClientSupportPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader 
        title="Central de Suporte" 
        description="Abra e acompanhe seus chamados de atendimento." 
      />
      <SupportTicketList />
    </div>
  );
}
