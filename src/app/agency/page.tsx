

import { ClientSummaryGrid } from '@/components/cards/ClientSummaryGrid';
import { TasksBoardPreview } from '@/components/cards/TasksBoardPreview';
import { UpcomingCalendarWidget } from '@/components/cards/UpcomingCalendarWidget';
import { TeamActivityFeed } from '@/components/cards/TeamActivityFeed';
import { PageHeader } from '@/components/ui/PageHeader';

export function AgencyDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard da Agência" 
        description="Visão geral e desempenho de todos os clientes." 
      />
      
      <ClientSummaryGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksBoardPreview />
        <UpcomingCalendarWidget />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TeamActivityFeed />
      </div>
    </div>
  );
}
