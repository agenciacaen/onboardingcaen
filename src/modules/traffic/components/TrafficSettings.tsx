import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { trafficService } from '../services/traffic.service';
import { toast } from 'sonner';
import { Save, LayoutGrid, MousePointer2, Target, BarChart3, Video, MessageSquare, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TrafficSettingsProps {
  clientId: string;
  onSettingsUpdated?: () => void;
}

const METRIC_CATEGORIES = [
  {
    id: 'performance',
    label: 'Performance',
    icon: BarChart3,
    metrics: [
      { id: 'spend', label: 'Investimento' },
      { id: 'impressions', label: 'Impressões' },
      { id: 'reach', label: 'Alcance' },
      { id: 'frequency', label: 'Frequência' },
      { id: 'cpm', label: 'CPM (Custo por mil)' },
    ]
  },
  {
    id: 'clicks',
    label: 'Cliques e CTR',
    icon: MousePointer2,
    metrics: [
      { id: 'clicks', label: 'Cliques (Todos)' },
      { id: 'link_clicks', label: 'Cliques no Link' },
      { id: 'cpc', label: 'CPC (Todos)' },
      { id: 'cpc_link', label: 'CPC (Link)' },
      { id: 'ctr', label: 'CTR (Todos)' },
      { id: 'ctr_link', label: 'CTR (Link)' },
    ]
  },
  {
    id: 'conversions',
    label: 'E-commerce',
    icon: Target,
    metrics: [
      { id: 'purchases', label: 'Compras' },
      { id: 'revenue', label: 'Receita' },
      { id: 'roas', label: 'ROAS' },
      { id: 'initiate_checkout', label: 'Checkouts Iniciados' },
      { id: 'add_to_cart', label: 'Adições ao Carrinho' },
      { id: 'view_content', label: 'Vizu. Conteúdo' },
    ]
  },
  {
    id: 'messaging',
    label: 'Contatos e Leads',
    icon: MessageSquare,
    metrics: [
      { id: 'conversations', label: 'Conversas Iniciadas' },
      { id: 'leads', label: 'Leads (Total)' },
      { id: 'landing_page_views', label: 'Visitas na Página' },
    ]
  },
  {
    id: 'engagement',
    label: 'Engajamento',
    icon: Heart,
    metrics: [
      { id: 'post_engagement', label: 'Envolvi. Publicação' },
      { id: 'post_reaction', label: 'Reações' },
      { id: 'comment', label: 'Comentários' },
      { id: 'shared', label: 'Compartilhamentos' },
      { id: 'page_engagement', label: 'Envolvi. Página' },
    ]
  },
  {
    id: 'video',
    label: 'Vídeo',
    icon: Video,
    metrics: [
      { id: 'video_p25', label: 'Vídeo 25%' },
      { id: 'video_p50', label: 'Vídeo 50%' },
      { id: 'video_p75', label: 'Vídeo 75%' },
      { id: 'video_p95', label: 'Vídeo 95%' },
      { id: 'video_p100', label: 'Vídeo 100%' },
    ]
  }
];

export function TrafficSettings({ clientId, onSettingsUpdated }: TrafficSettingsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [funnelMetric, setFunnelMetric] = useState<string>('conversions');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const settings = await trafficService.getSettings(clientId);
      if (settings) {
        setSelectedMetrics(settings.selected_metrics || ['spend', 'purchases', 'revenue', 'roas', 'landing_page_views']);
        setFunnelMetric(settings.funnel_main_metric || 'conversions');
      }
    }
    loadSettings();
  }, [clientId]);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const success = await trafficService.updateSettings(clientId, {
        selected_metrics: selectedMetrics,
        funnel_main_metric: funnelMetric
      });

      if (success) {
        toast.success('Configurações salvas!');
        onSettingsUpdated?.();
      } else {
        toast.error('Erro ao salvar configurações.');
      }
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border backdrop-blur-sm shadow-2xl">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pb-7">
        <div className="space-y-1 text-center sm:text-left">
          <CardTitle className="text-xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Configuração do Dashboard
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Personalize métricas e o funil de vendas com dados nativos do Meta Ads.
          </CardDescription>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 w-full sm:w-auto"
        >
          {isSaving ? 'Salvando...' : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* FUNNEL CONFIGURATION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-inner">
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <Label className="text-foreground font-bold text-base flex items-center justify-center sm:justify-start gap-2">
                <Target className="h-4 w-4 text-primary" />
                Métrica Final do Funil
              </Label>
              <p className="text-xs text-muted-foreground">Define qual evento encerra o fluxo do funil de tráfego.</p>
            </div>
            <Select value={funnelMetric} onValueChange={setFunnelMetric}>
              <SelectTrigger className="w-full sm:w-[240px] bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversions">Conversões (Nativo Meta)</SelectItem>
                <SelectItem value="purchases">Compras (E-commerce)</SelectItem>
                <SelectItem value="leads">Leads (Cadastros)</SelectItem>
                <SelectItem value="conversations">Conversas Iniciadas</SelectItem>
                <SelectItem value="landing_page_views">Visitas na Página</SelectItem>
                <SelectItem value="initiate_checkout">Checkouts Iniciados</SelectItem>
                <SelectItem value="link_clicks">Cliques no Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* METRICS CATEGORIES */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="bg-muted p-1 mb-6 flex flex-wrap h-auto gap-1 justify-center sm:justify-start">
            {METRIC_CATEGORIES.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] py-1.5 px-3 transition-all duration-300 flex items-center"
              >
                <cat.icon className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {METRIC_CATEGORIES.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-0 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${
                      selectedMetrics.includes(metric.id) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/20 border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`metric-${metric.id}`}
                        className={`text-sm font-medium cursor-pointer transition-colors ${
                          selectedMetrics.includes(metric.id) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {metric.label}
                      </Label>
                    </div>
                    <Switch
                      id={`metric-${metric.id}`}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                      className="data-[state=checked]:bg-primary shadow-lg"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
