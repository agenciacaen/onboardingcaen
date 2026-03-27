import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { HardHat } from 'lucide-react';

export function ClientFinancialPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Faturas, pagamentos e planos atuais." />
      <EmptyState icon={HardHat} title="Em construção" description="Esta página será implementada em breve." />
    </div>
  );
}
