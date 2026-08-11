import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { SolutionService } from "@/services/solution.service";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CalendarClock, Check, Layers, Link2, Loader2, Pause, Play, Trash2, X } from "lucide-react";
import type {
  Solution,
  SolutionConfig,
  SolutionInstance,
  SolutionInstanceStatus,
  SolutionProgress,
} from "@/types/solution.types";

interface ConfigOption {
  key: keyof SolutionConfig;
  label: string;
  description: string;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  { key: "needs_crm", label: "CRM + IA", description: "Funil, pipeline e automações de qualificação" },
  { key: "social_media", label: "Social Media", description: "Conteúdo, calendário e publicações" },
  { key: "meta_ads", label: "Meta Ads", description: "Tráfego pago no Facebook e Instagram" },
  { key: "ia_sdr", label: "IA SDR", description: "Prospecção e follow-up automáticos" },
  { key: "needs_lp", label: "Landing Page", description: "Página de conversão para os anúncios" },
  { key: "needs_site", label: "Site institucional", description: "Site da empresa" },
  { key: "google_ads", label: "Google Ads", description: "Pesquisa, display e remarketing" },
  { key: "commercial_team", label: "Equipe comercial", description: "Captação presencial e ligações" },
];

const DEFAULT_CONFIG: SolutionConfig = CONFIG_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.key]: true }),
  {} as SolutionConfig
);

const STATUS_LABEL: Record<SolutionInstanceStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  removed: "Removida",
};

const STATUS_CLASS: Record<SolutionInstanceStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  removed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AgencyClientSolutionsPage() {
  const { id } = useParams();
  const { user } = useAuthStore();

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [instances, setInstances] = useState<SolutionInstance[]>([]);
  const [progressByInstance, setProgressByInstance] = useState<Record<string, SolutionProgress>>({});
  const [loading, setLoading] = useState(true);

  const [selectedSolutionId, setSelectedSolutionId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [config, setConfig] = useState<SolutionConfig>({ ...DEFAULT_CONFIG });
  const [startDate, setStartDate] = useState(todayISO());
  const [linking, setLinking] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDates, setRescheduleDates] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [solutionList, instanceList] = await Promise.all([
        SolutionService.listSolutions(),
        SolutionService.listClientInstances(id),
      ]);
      setSolutions(solutionList);
      const activeInstances = instanceList.filter((i) => i.status !== "removed");
      setInstances(activeInstances);

      const progressMap: Record<string, SolutionProgress> = {};
      await Promise.all(
        activeInstances.map(async (inst) => {
          try {
            progressMap[inst.id] = await SolutionService.getProgress(inst.id);
          } catch (err) {
            console.error("Erro ao calcular progresso:", err);
          }
        })
      );
      setProgressByInstance(progressMap);
    } catch (err) {
      console.error("Erro ao carregar soluções:", err);
      toast.error("Erro ao carregar soluções.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedSolution = solutions.find((s) => s.id === selectedSolutionId);
  const availableVersions = selectedSolution?.versions ?? [];

  const handleSelectSolution = (solutionId: string) => {
    setSelectedSolutionId(solutionId);
    const solution = solutions.find((s) => s.id === solutionId);
    const version = solution?.versions?.find((v) => v.is_current) ?? solution?.versions?.[0];
    setSelectedVersionId(version?.id ?? "");
  };

  const toggleConfig = (key: keyof SolutionConfig, checked: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: checked }));
  };

  const handleLink = async () => {
    if (!id || !user?.id) return;
    if (!selectedVersionId) {
      toast.error("Selecione uma solução e versão.");
      return;
    }
    if (!startDate) {
      toast.error("Informe a data de início.");
      return;
    }
    setLinking(true);
    try {
      const { created, tasksCreated } = await SolutionService.instantiate({
        clientId: id,
        versionId: selectedVersionId,
        startDate,
        config,
        userId: user.id,
      });
      toast.success(
        created
          ? `Solução vinculada! Semana 1 liberada com ${tasksCreated} tarefas no roadmap.`
          : "Esta solução já está vinculada a este cliente."
      );
      await loadData();
    } catch (err) {
      console.error("Erro ao vincular solução:", err);
      toast.error("Erro ao vincular solução.");
    } finally {
      setLinking(false);
    }
  };

  const runAction = async (instanceId: string, action: () => Promise<unknown>, successMsg: string) => {
    setActionId(instanceId);
    try {
      await action();
      toast.success(successMsg);
      await loadData();
    } catch (err) {
      console.error("Erro na operação:", err);
      toast.error("Não foi possível concluir a operação.");
    } finally {
      setActionId(null);
    }
  };

  const handlePause = (instanceId: string) =>
    runAction(instanceId, () => SolutionService.pause(instanceId), "Solução pausada.");

  const handleResume = (instanceId: string) =>
    runAction(instanceId, () => SolutionService.resume(instanceId), "Solução retomada.");

  const handleRemove = (instanceId: string) => {
    if (!window.confirm("Remover esta solução? As tarefas já criadas no roadmap serão mantidas.")) return;
    runAction(instanceId, () => SolutionService.remove(instanceId), "Solução removida.");
  };

  const handleReschedule = (instanceId: string) => {
    const newDate = rescheduleDates[instanceId];
    if (!newDate) {
      toast.error("Informe a nova data de início.");
      return;
    }
    runAction(instanceId, () => SolutionService.reschedule(instanceId, newDate), "Solução reagendada.").then(() => {
      setReschedulingId(null);
    });
  };

  const versionLabel = (instance: SolutionInstance): string => {
    for (const s of solutions) {
      const v = s.versions?.find((ver) => ver.id === instance.version_id);
      if (v) return `${s.name} · v${v.version}`;
    }
    return "Solução";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Vincular solução
          </CardTitle>
          <CardDescription>
            O roadmap é liberado semana a semana: ao concluir todas as tarefas de uma semana, a próxima é criada automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Solução</Label>
            <select
              value={selectedSolutionId}
              onChange={(e) => handleSelectSolution(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selecione uma solução</option>
              {solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Versão</Label>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              disabled={!selectedSolution}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Selecione a versão</option>
              {availableVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}{v.is_current ? " (atual)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Escopo incluído</Label>
            <div className="space-y-2.5">
              {CONFIG_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={Boolean(config[opt.key])}
                    onCheckedChange={(checked) => toggleConfig(opt.key, checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Data de início</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <Button onClick={handleLink} disabled={linking || !selectedVersionId} className="w-full gap-2">
            {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Vincular solução
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Soluções vinculadas ({instances.length})</h2>
        </div>

        {instances.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-zinc-500">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma solução vinculada a este cliente ainda.</p>
          </div>
        ) : (
          instances.map((instance) => {
            const progress = progressByInstance[instance.id];
            const isActing = actionId === instance.id;
            return (
              <Card key={instance.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{versionLabel(instance)}</CardTitle>
                    <Badge variant="outline" className={STATUS_CLASS[instance.status]}>
                      {STATUS_LABEL[instance.status]}
                    </Badge>
                  </div>
                  <CardDescription>
                    Início: {formatDate(instance.start_date)} · Fim: {formatDate(instance.end_date)} · Vinculada em{" "}
                    {formatDate(instance.linked_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {CONFIG_OPTIONS.filter((opt) => instance.config[opt.key]).map((opt) => (
                      <Badge key={opt.key} variant="secondary" className="text-xs font-normal">
                        {opt.label}
                      </Badge>
                    ))}
                  </div>

                  {progress && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {progress.done} de {progress.total} tarefas
                        </span>
                        <span>{progress.percent}%</span>
                      </div>
                      <Progress value={progress.percent} />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {instance.status === "active" ? (
                      <Button variant="outline" size="sm" disabled={isActing} onClick={() => handlePause(instance.id)} className="gap-1.5">
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                        Pausar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={isActing} onClick={() => handleResume(instance.id)} className="gap-1.5">
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Retomar
                      </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={() => setReschedulingId(reschedulingId === instance.id ? null : instance.id)} className="gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Reagendar
                    </Button>

                    <Button variant="ghost" size="sm" disabled={isActing} onClick={() => handleRemove(instance.id)} className="gap-1.5 text-destructive hover:text-destructive">
                      {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remover
                    </Button>
                  </div>

                  {reschedulingId === instance.id && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="date"
                        value={rescheduleDates[instance.id] ?? instance.start_date?.slice(0, 10) ?? ""}
                        onChange={(e) => setRescheduleDates((prev) => ({ ...prev, [instance.id]: e.target.value }))}
                        className="w-48"
                      />
                      <Button size="sm" disabled={isActing} onClick={() => handleReschedule(instance.id)} className="gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Confirmar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReschedulingId(null)} className="gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}