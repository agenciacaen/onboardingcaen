import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, MessageCircle, Zap, Loader2, Plus, RefreshCw, 
  Trash2, Rocket, Users
} from "lucide-react";
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface WhatsAppInstance {
  id: string;
  name: string;
  instance_name: string;
  status: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  whatsapp_instance_id: string | null;
  whatsapp_group_id: string | null;
  ai_summary_enabled: boolean;
}

export default function AIAgentPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [newInstanceName, setNewInstanceName] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: instData } = await supabase.from("whatsapp_instances").select("*").order("created_at", { ascending: false });
      const { data: clientData } = await supabase.from("clients").select("id, name, whatsapp_instance_id, whatsapp_group_id, ai_summary_enabled").eq("onboarding_completed", true);

      setInstances(instData || []);
      setClients(clientData || []);
    } catch (err) {
      toast.error("Erro ao carregar dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Dê um nome para a instância.");
      return;
    }
    setCreatingInstance(true);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-manager", {
        body: { action: "create-global-instance", name: newInstanceName }
      });
      if (error) throw error;
      
      toast.success("Instância criada! Escaneie o QR Code.");
      setQrCode(data.base64 || null);
      setPollingId(data.instanceId);
      setNewInstanceName("");
      fetchData();
    } catch (err) {
      toast.error("Erro ao criar instância.");
      console.error(err);
    } finally {
      setCreatingInstance(false);
    }
  };

  const checkStatus = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("evolution-manager", {
        body: { action: "check-global-status", instanceId: id }
      });
      if (error) throw error;
      if (data.status === "open") {
        toast.success("WhatsApp Conectado!");
        setPollingId(null);
        setQrCode(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  }, [fetchData]);

  useEffect(() => {
    let interval: any;
    if (pollingId) {
      interval = setInterval(() => checkStatus(pollingId), 5000);
    }
    return () => clearInterval(interval);
  }, [pollingId, checkStatus]);

  const handleLogout = async (id: string) => {
    if (!confirm("Deseja desconectar e remover esta instância?")) return;
    try {
      const { error } = await supabase.functions.invoke("evolution-manager", {
        body: { action: "logout-global", instanceId: id }
      });
      if (error) throw error;
      toast.success("Instância removida.");
      fetchData();
    } catch (err) {
      toast.error("Erro ao remover.");
      console.error(err);
    }
  };

  const updateClientConfig = async (clientId: string, updates: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", clientId);
      if (error) throw error;
      toast.success("Configuração atualizada.");
      setClients(clients.map(c => c.id === clientId ? { ...c, ...updates } : c));
    } catch (err) {
      toast.error("Erro ao salvar.");
      console.error(err);
    }
  };

  const handleManualTrigger = async () => {
    try {
      const { error } = await supabase.functions.invoke("whatsapp-ai-summary", {
        body: {}
      });
      if (error) throw error;
      toast.success("Disparo de resumos iniciado!");
    } catch (err) {
      toast.error("Erro ao disparar.");
      console.error(err);
    }
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-blue-500" />
        <PageHeader 
            title="Agente IA de Onboarding" 
            description="Gerencie seus números de WhatsApp e as automações de cada cliente." 
        />
      </div>

      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Instâncias (WhatsApp)
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Configuração de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border rounded-xl p-6 bg-white shadow-sm h-fit">
              <h3 className="font-semibold mb-4">Nova Instância</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Amigável</Label>
                  <Input 
                    placeholder="Ex: Celular Principal Agência" 
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateInstance}
                  disabled={creatingInstance || !!qrCode}
                >
                  {creatingInstance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Gerar QR Code
                </Button>
                
                {qrCode && (
                  <div className="mt-6 p-4 border rounded-lg bg-zinc-50 flex flex-col items-center">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-full aspect-square mb-4 shadow-sm" />
                    <p className="text-xs text-center text-zinc-500 animate-pulse">Aguardando leitura do WhatsApp...</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setQrCode(null); setPollingId(null); }}>Cancelar</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-semibold px-1 flex items-center gap-2">
                Suas Instâncias Conectadas
                <Button variant="ghost" size="icon" onClick={fetchData} className="h-6 w-6">
                  <RefreshCw className="w-3 h-3 text-zinc-400" />
                </Button>
              </h3>
              
              <div className="grid gap-4">
                {instances.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10">
                    <MessageCircle className="w-12 h-12 text-zinc-200 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">Nenhuma instância cadastrada ainda.</p>
                  </div>
                ) : (
                  instances.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${inst.status === 'open' ? 'bg-green-500' : 'bg-zinc-300'} animate-pulse`} />
                        <div>
                          <p className="font-medium text-sm">{inst.name}</p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{inst.instance_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={inst.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
                          {inst.status === 'open' ? 'Conectado' : 'Aguardando'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleLogout(inst.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="pt-4">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Instância de Envio</TableHead>
                  <TableHead>JID do Grupo</TableHead>
                  <TableHead className="text-center">Resumo Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Select 
                        value={client.whatsapp_instance_id || "none"}
                        onValueChange={(val) => updateClientConfig(client.id, { whatsapp_instance_id: val === "none" ? null : val })}
                      >
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Selecione um número" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {instances.filter(i => i.status === 'open').map(inst => (
                            <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        className="h-8 text-xs w-[250px]" 
                        placeholder="Ex: 5511...-1456@g.us"
                        value={client.whatsapp_group_id || ""}
                        onBlur={(e) => updateClientConfig(client.id, { whatsapp_group_id: e.target.value })}
                        onChange={(e) => {
                          const newClients = clients.map(c => c.id === client.id ? { ...c, whatsapp_group_id: e.target.value } : c);
                          setClients(newClients);
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={client.ai_summary_enabled}
                          onCheckedChange={(checked) => updateClientConfig(client.id, { ai_summary_enabled: checked })}
                          className="scale-75"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={handleManualTrigger} className="h-8 flex items-center gap-2 text-zinc-500 hover:text-blue-500">
                        <Rocket className="w-3 h-3" />
                        Testar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
