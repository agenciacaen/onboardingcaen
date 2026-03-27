import { PageHeader } from '../../../components/ui/PageHeader';
import { ApprovalUnifiedQueue } from '../../../modules/approvals/components/ApprovalUnifiedQueue';

export function ClientApprovalsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader 
        title="Centra de Aprovações" 
        description="Acompanhe as entregas que precisam da sua autorização." 
      />
      <ApprovalUnifiedQueue />
    </div>
  );
}
