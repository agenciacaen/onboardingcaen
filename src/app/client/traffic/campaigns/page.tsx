import { useState, useEffect } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import type { CampaignData } from '@/modules/traffic/components/CampaignTable';
import { CampaignTable } from '@/modules/traffic/components/CampaignTable';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import type { DateRange } from 'react-day-picker';
import { subDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { trafficService } from '@/modules/traffic/services/traffic.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function ClientCampaignsPage() {
  const { clientId } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      if (!clientId || !dateRange?.from || !dateRange?.to) return;
      setIsLoading(true);
      try {
        const rawCampaigns = await trafficService.getCampaigns(clientId);
        
        // Formatar para o componente CampaignTable
        const formattedCampaigns: CampaignData[] = rawCampaigns.map((camp: any) => {
          let totalImpressions = 0;
          let totalClicks = 0;
          let totalSpend = 0;
          let totalConversions = 0;
          
          const customMetrics: Record<string, number> = {};

          if (camp.traffic_metrics && Array.isArray(camp.traffic_metrics)) {
            // Filtrar metricas pelo dateRange 
            const filteredMetrics = camp.traffic_metrics.filter((m: any) => {
              if (!m.date) return false;
              const date = parseISO(m.date);
              return date >= dateRange.from! && date <= dateRange.to!;
            });

            filteredMetrics.forEach((m: any) => {
              totalImpressions += Number(m.impressions || 0);
              totalClicks += Number(m.clicks || 0);
              totalSpend += Number(m.spend || 0);
              totalConversions += Number(m.conversions || 0);
              
              // Somar raw_actions
              if (m.raw_actions && Array.isArray(m.raw_actions)) {
                m.raw_actions.forEach((action: any) => {
                  const type = action.action_type;
                  const value = Number(action.value || 0);
                  if (!customMetrics[type]) customMetrics[type] = 0;
                  customMetrics[type] += value;
                });
              }
            });
          }

          const roas = totalSpend > 0 ? totalConversions / totalSpend : 0;

          return {
            id: camp.id || '',
            name: camp.name || 'Campanha Desconhecida',
            platform: camp.platform as any || 'meta',
            status: camp.status as any || 'draft',
            budget_daily: Number(camp.budget_daily || 0),
            spend: totalSpend,
            impressions: totalImpressions,
            clicks: totalClicks,
            roas: roas,
            custom_metrics: customMetrics
          };
        });

        // Ordenar campanhas por gasto
        setCampaigns(formattedCampaigns.sort((a, b) => b.spend - a.spend));
      } catch (err) {
        console.error("Erro ao carregar campanhas", err);
        toast.error("Erro ao carregar campanhas");
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaigns();
  }, [clientId, dateRange]);

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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CampaignTable campaigns={campaigns} />
          )}
        </div>
      </div>
    </div>
  );
}
