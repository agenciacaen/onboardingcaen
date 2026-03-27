import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { AdCardGrid } from '@/modules/traffic/components/AdCardGrid';
import type { AdData } from '@/modules/traffic/components/AdSetList';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';

export function ClientAdsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const mockAds: AdData[] = useMemo(() => [
    { id: 'ad1', name: '[M] - Oferta Imóvel X - Vídeo 01', status: 'active', ctr: 4.8, cpc: 0.85, roas: 5.8, is_best: true, impressions: 45000, spend: 1200 },
    { id: 'ad2', name: '[G] - Search - Imóvel Y - Banner 02', status: 'active', ctr: 3.5, cpc: 1.25, roas: 4.2, impressions: 32000, spend: 950 },
    { id: 'ad3', name: '[T] - Story - Imóvel Z - Depoimento', status: 'paused', ctr: 6.1, cpc: 1.10, roas: 3.9, impressions: 12000, spend: 450 },
    { id: 'ad4', name: '[M] - Banner Promoção Mensal', status: 'rejected', ctr: 0.8, cpc: 2.50, roas: 1.2, impressions: 8500, spend: 210 },
    { id: 'ad5', name: '[M] - Retargeting - Site Visit', status: 'active', ctr: 5.2, cpc: 0.95, roas: 7.4, is_best: true, impressions: 15000, spend: 320 },
    { id: 'ad6', name: '[L] - B2B Lead Gen - Ebook', status: 'draft', ctr: 0.0, cpc: 0.0, roas: 0.0, impressions: 0, spend: 0 }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Galeria de Anúncios" 
          description="Monitore a performance criativa de todos os anúncios ativos nas plataformas de tráfego pago."
        />
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            <DownloadCloud className="h-4 w-4" />
            Exportar Criativos
          </Button>
        </div>
      </div>

      <div className="bg-card w-full rounded-lg shadow-sm">
        <div className="p-6">
          <AdCardGrid ads={mockAds} />
        </div>
      </div>
    </div>
  );
}
