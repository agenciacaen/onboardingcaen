import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { trafficService } from '../services/traffic.service';
import { toast } from 'sonner';
import { LayoutDashboard, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface TrafficSettingsProps {
  clientId: string;
  onSettingsUpdated: () => void;
}

const AVAILABLE_METRICS = [
  { id: 'spend', label: 'Investimento total', description: 'Valor total gasto em anúncios' },
  { id: 'impressions', label: 'Impressões', description: 'Número de vezes que os anúncios foram exibidos' },
  { id: 'clicks', label: 'Cliques', description: 'Cliques recebidos nos anúncios' },
  { id: 'reach', label: 'Alcance', description: 'Pessoas únicas que viram os anúncios' },
  { id: 'ctr', label: 'CTR (%)', description: 'Taxa de cliques por impressão' },
  { id: 'cpc', label: 'CPC médio', description: 'Custo médio por clique' },
  { id: 'cpm', label: 'CPM médio', description: 'Custo médio por mil impressões' },
  { id: 'roas', label: 'ROAS', description: 'Retorno sobre investimento publicitário' },
  { id: 'frequency', label: 'Frequência', description: 'Número médio de vezes que cada pessoa viu o anúncio' },
  { id: 'purchases', label: 'Compras', description: 'Total de compras rastreadas' },
  { id: 'leads', label: 'Leads', description: 'Total de leads ou cadastros realizados' },
  { id: 'conversations', label: 'Conversas Iniciadas', description: 'Novas conversas no WhatsApp/Messenger' },
  { id: 'landing_page_views', label: 'Visitas na Página', description: 'Visualizações da página de destino' },
  { id: 'revenue', label: 'Receita Estimada', description: 'Valor estimado de vendas geradas' },
];

export function TrafficSettings({ clientId, onSettingsUpdated }: TrafficSettingsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const settings = await trafficService.getSettings(clientId);
        if (settings && settings.selected_metrics) {
          setSelectedMetrics(settings.selected_metrics);
        } else {
          // Default metrics if none saved
          setSelectedMetrics(['spend', 'purchases', 'revenue', 'roas', 'landing_page_views']);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (clientId) loadSettings();
  }, [clientId]);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId) 
        : [...prev, metricId]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await trafficService.updateSettings(clientId, { selected_metrics: selectedMetrics });
      toast.success('Configurações salvas com sucesso!');
      onSettingsUpdated();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/40 border-slate-800">
        <CardContent className="p-8 flex justify-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-white text-lg">Configurar Dashboard</CardTitle>
              <CardDescription className="text-slate-400">
                Selecione quais métricas você deseja ver nos cards principais do dashboard.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVAILABLE_METRICS.map((metric) => (
              <div key={metric.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/30 transition-colors">
                <Switch 
                  id={`metric-${metric.id}`} 
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => toggleMetric(metric.id)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor={`metric-${metric.id}`}
                    className="text-sm font-medium text-white cursor-pointer"
                  >
                    {metric.label}
                  </Label>
                  <p className="text-xs text-slate-500">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 hidden sm:block" />
              <p className="text-xs text-slate-400">
                As métricas são atualizadas conforme a sincronização com o Meta Ads. 
                Algumas métricas podem demorar até 24h para aparecer conforme o delay da própria plataforma.
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
