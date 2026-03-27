import { useState, useMemo } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import type { CampaignData } from '@/modules/traffic/components/CampaignTable';
import { CampaignTable } from '@/modules/traffic/components/CampaignTable';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import type { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';

export function ClientCampaignsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const mockCampaigns: CampaignData[] = useMemo(() => [
    {
      id: "comp_1A2B3D4F5G",
      name: "[BF] - Lançamento Ofertas",
      platform: "meta",
      status: "active",
      budget_daily: 150.00,
      spend: 4500.20,
      impressions: 125430,
      clicks: 4325,
      roas: 3.8
    },
    {
      id: "comp_9F8E7D6C5B",
      name: "Search - Fundo de Funil",
      platform: "google",
      status: "active",
      budget_daily: 80.00,
      spend: 2150.80,
      impressions: 15400,
      clicks: 1205,
      roas: 5.6
    },
    {
      id: "comp_2X3Y4Z5W6V",
      name: "[VideoView] Brand Awareness",
      platform: "tiktok",
      status: "paused",
      budget_daily: 40.00,
      spend: 1200.00,
      impressions: 250000,
      clicks: 1400,
      roas: 0.8
    },
    {
      id: "comp_4C5D6E7F8G",
      name: "B2B Lead Gen",
      platform: "linkedin",
      status: "draft",
      budget_daily: 200.00,
      spend: 0.00,
      impressions: 0,
      clicks: 0,
      roas: 0.0
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Campanhas" description="Gerencie e acompanhe de perto os custos e status das suas campanhas em todas as plataformas." />
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon" title="Exportar CSV">
            <DownloadCloud className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-card w-full rounded-lg shadow-sm">
        <div className="p-6">
          <CampaignTable data={mockCampaigns} />
        </div>
      </div>
    </div>
  );
}
