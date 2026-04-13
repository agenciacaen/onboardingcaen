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
      { id: 'add_payment_info', label: 'Info. de Pagamento' },
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
      { id: 'contact', label: 'Contatos' },
      { id: 'submit_application', label: 'Candidaturas' },
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
      { id: 'onsite_conversion.post_save', label: 'Salvamentos' },
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
      { id: 'thruplay', label: 'ThruPlays' },
    ]
  }
];

interface FunnelStepConfig {
  label: string;
  metric: string;
}

interface FunnelConfig {
  template: string;
  steps: FunnelStepConfig[];
}

interface ChartConfig {
  left_metric: string;
  right_metric: string;
}

interface AdsConfig {
  sort_by: string;
  limit: number;
}

interface VisibilityConfig {
  show_funnel: boolean;
  show_chart: boolean;
  show_ranking: boolean;
  show_table: boolean;
  show_summary_cards: boolean;
}

export function TrafficSettings({ clientId, onSettingsUpdated }: TrafficSettingsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [funnelMetric, setFunnelMetric] = useState<string>('conversions');
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>({
    template: 'ecommerce',
    steps: [
      { label: 'Cliques', metric: 'clicks' },
      { label: 'Page Views', metric: 'landing_page_views' },
      { label: 'Checkouts', metric: 'initiate_checkout' },
      { label: 'Compras', metric: 'purchases' }
    ]
  });
  
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    left_metric: 'spend',
    right_metric: 'revenue'
  });

  const [adsConfig, setAdsConfig] = useState<AdsConfig>({
    sort_by: 'conversions',
    limit: 5
  });

  const [visibilityConfig, setVisibilityConfig] = useState<VisibilityConfig>({
    show_funnel: true,
    show_chart: true,
    show_ranking: true,
    show_table: true,
    show_summary_cards: true
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const settings = await trafficService.getSettings(clientId);
      if (settings) {
        setSelectedMetrics(settings.selected_metrics || ['spend', 'purchases', 'revenue', 'roas', 'landing_page_views']);
        setFunnelMetric(settings.funnel_main_metric || 'conversions');
        if (settings.funnel_config) setFunnelConfig(settings.funnel_config);
        if (settings.chart_config) setChartConfig(settings.chart_config);
        if (settings.ads_config) setAdsConfig(settings.ads_config);
        if (settings.visibility_config) setVisibilityConfig(settings.visibility_config);
      }
    }
    loadSettings();
  }, [clientId]);

  const funnelTemplates = {
    messaging: {
      template: 'messaging',
      steps: [
        { label: 'Impressões', metric: 'impressions' },
        { id: 'clicks', label: 'Cliques', metric: 'clicks' },
        { label: 'Conversas', metric: 'conversations' }
      ]
    },
    ecommerce: {
      template: 'ecommerce',
      steps: [
        { label: 'Cliques', metric: 'clicks' },
        { label: 'Page Views', metric: 'landing_page_views' },
        { label: 'Checkouts', metric: 'initiate_checkout' },
        { label: 'Compras', metric: 'purchases' }
      ]
    },
    leads: {
      template: 'leads',
      steps: [
        { label: 'Impressões', metric: 'impressions' },
        { label: 'Cliques', metric: 'clicks' },
        { label: 'Visitas', metric: 'landing_page_views' },
        { label: 'Leads', metric: 'leads' }
      ]
    }
  };

  const applyTemplate = (type: string) => {
    if (type === 'custom') {
      setFunnelConfig(prev => ({ ...prev, template: 'custom' }));
      return;
    }
    const template = funnelTemplates[type as keyof typeof funnelTemplates];
    if (template) {
      setFunnelConfig(template);
    }
  };

  const updateStep = (index: number, field: keyof FunnelStepConfig, value: string) => {
    const newSteps = [...funnelConfig.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFunnelConfig({ ...funnelConfig, steps: newSteps, template: 'custom' });
  };

  const removeStep = (index: number) => {
    if (funnelConfig.steps.length <= 1) return;
    const newSteps = funnelConfig.steps.filter((_, i) => i !== index);
    setFunnelConfig({ ...funnelConfig, steps: newSteps, template: 'custom' });
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const updateVisibility = (key: keyof VisibilityConfig, value: boolean) => {
    setVisibilityConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const success = await trafficService.updateSettings(clientId, {
        selected_metrics: selectedMetrics,
        funnel_main_metric: funnelMetric,
        funnel_config: funnelConfig,
        chart_config: chartConfig,
        ads_config: adsConfig,
        visibility_config: visibilityConfig
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

  const ALL_METRICS = METRIC_CATEGORIES.flatMap(c => c.metrics);

  return (
    <Card className="bg-card border-border backdrop-blur-sm shadow-2xl">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pb-7">
        <div className="space-y-1 text-center sm:text-left">
          <CardTitle className="text-xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Configuração do Dashboard
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Personalize métricas, eixos de gráficos e a visibilidade de cada card.
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
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="bg-muted p-1 mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="funnel" className="text-xs">Estrutura do Funil</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Kpis do Topo</TabsTrigger>
            <TabsTrigger value="charts" className="text-xs">Gráficos e Ranking</TabsTrigger>
            <TabsTrigger value="visibility" className="text-xs">Visibilidade</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Template do Funil</Label>
                  <Select value={funnelConfig.template} onValueChange={applyTemplate}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="messaging">Mensagens (Direct/WhatsApp)</SelectItem>
                      <SelectItem value="ecommerce">E-commerce (Vendas Online)</SelectItem>
                      <SelectItem value="leads">Leads (Captação)</SelectItem>
                      <SelectItem value="custom">Customizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objetivo Principal (Card KPI)</Label>
                  <Select value={funnelMetric} onValueChange={setFunnelMetric}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversations">Conversas Iniciadas</SelectItem>
                      <SelectItem value="purchases">Compras</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="conversions">Conversões Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Etapas do Funil (Visual)</Label>
                <div className="space-y-2 border border-border rounded-xl p-4 bg-muted/30">
                  {funnelConfig.steps.map((step, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center relative group">
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px] text-muted-foreground">Etapa {index + 1}</Label>
                        <input 
                          value={step.label}
                          onChange={(e) => updateStep(index, 'label', e.target.value)}
                          className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px] text-muted-foreground">Métrica Vinculada</Label>
                        <Select value={step.metric} onValueChange={(val) => updateStep(index, 'metric', val)}>
                          <SelectTrigger className="h-9 bg-background border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_METRICS.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeStep(index)}
                        disabled={funnelConfig.steps.length <= 1}
                      >
                         <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </Button>
                    </div>
                  ))}
                  {funnelConfig.steps.length < 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2 border border-dashed border-border hover:bg-muted text-[10px] py-4"
                      onClick={() => setFunnelConfig(prev => ({ ...prev, steps: [...prev.steps, { label: 'Nova Etapa', metric: 'clicks' }] }))}
                    >
                      + Adicionar Etapa (Máx. 5)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase text-primary">Configuração do Gráfico de Área</Label>
                <div className="space-y-4 p-4 border border-border rounded-xl bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground italic">Métrica Eixo Y (Esquerdo)</Label>
                    <Select value={chartConfig.left_metric} onValueChange={(v) => setChartConfig(prev => ({ ...prev, left_metric: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_METRICS.map(m => (<SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground italic">Métrica Eixo Y (Direito)</Label>
                    <Select value={chartConfig.right_metric} onValueChange={(v) => setChartConfig(prev => ({ ...prev, right_metric: v }))}>
                      <SelectTrigger className="bg-background border-border border-emerald-500/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_METRICS.map(m => (<SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase text-primary">Ranking de Melhores Anúncios</Label>
                <div className="space-y-4 p-4 border border-border rounded-xl bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground italic">Cálculo de Ranking por:</Label>
                    <Select value={adsConfig.sort_by} onValueChange={(v) => setAdsConfig(prev => ({ ...prev, sort_by: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversions">Volume de Conversão</SelectItem>
                        <SelectItem value="spend">Maior Investimento</SelectItem>
                        <SelectItem value="roas">ROAS (Eficiência)</SelectItem>
                        <SelectItem value="cpc">Menor CPC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground italic">Quantidade de Anúncios</Label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" min="3" max="7" 
                        value={adsConfig.limit} 
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                        className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                      />
                      <span className="text-sm font-bold min-w-[20px]">{adsConfig.limit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visibility" className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'show_funnel', label: 'Funil de Tráfego', desc: 'Visualização da jornada do cliente' },
                  { id: 'show_chart', label: 'Gráfico Comparativo', desc: 'Análise evolutiva de duas métricas' },
                  { id: 'show_ranking', label: 'Ranking de Anúncios', desc: 'Top performance criativa' },
                  { id: 'show_table', label: 'Tabela de Campanhas', desc: 'Detalhamento por linha de campanha' },
                  { id: 'show_summary_cards', label: 'Cards de Conversão', desc: 'Resumo de custo por resultado' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">{item.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={visibilityConfig[item.id as keyof VisibilityConfig]} 
                      onCheckedChange={(val) => updateVisibility(item.id as keyof VisibilityConfig, val)} 
                    />
                  </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


          <TabsContent value="metrics" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

