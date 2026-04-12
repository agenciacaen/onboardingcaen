import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckCircle2, RefreshCw, Link2 } from "lucide-react";

interface MetaAccountManagerProps {
  clientId?: string;
}

export function MetaAccountManager({ clientId }: MetaAccountManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newAccountId, setNewAccountId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Estado interno para seleção de cliente quando clientId não é fornecido
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // O clientId efetivo: vindo da prop OU selecionado internamente
  const effectiveClientId = (clientId && clientId !== "all") ? clientId : selectedClientId;

  // Buscar lista de clientes quando o modal abre e não há clientId fixo
  useEffect(() => {
    if (isOpen && (!clientId || clientId === "all")) {
      async function fetchClients() {
        const { data } = await supabase
          .from("clients")
          .select("id, name")
          .in("status", ["active", "onboarding"]);
        if (data) setClients(data);
      }
      fetchClients();
    }
  }, [isOpen, clientId]);

  const fetchAccounts = async () => {
    if (!effectiveClientId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("meta_ad_accounts")
        .select("*")
        .eq("client_id", effectiveClientId);

      if (error) {
        console.error("[MetaAccountManager] Erro ao buscar contas:", error);
        toast.error("Erro ao carregar contas conectadas.");
      } else {
        setAccounts(data || []);
      }
    } catch (err) {
      console.error("[MetaAccountManager] Erro inesperado:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveClientId) {
      fetchAccounts();
    }
    if (!effectiveClientId) {
      setAccounts([]);
    }
  }, [isOpen, effectiveClientId]);

  const handleConnect = async () => {
    if (!newAccountId.trim()) return;
    if (!effectiveClientId) {
      toast.error("Selecione um cliente antes de conectar uma conta.");
      return;
    }

    setIsVerifying(true);
    try {
      console.log("[MetaAccountManager] Validando conta:", newAccountId);
      
      // Chamada para a Edge Function de validação
      const { data, error } = await supabase.functions.invoke("meta-validate-account", {
        body: { ad_account_id: newAccountId },
      });

      console.log("[MetaAccountManager] Resposta da validação:", { data, error });

      if (error) {
        console.error("[MetaAccountManager] Erro na Edge Function:", error);
        throw new Error(error.message || "Erro ao validar conta com a API do Meta.");
      }
      
      const result = data;

      if (result?.error) {
        throw new Error(result.error);
      }

      // Verificar se a conta já está conectada
      const { data: existing } = await supabase
        .from("meta_ad_accounts")
        .select("id")
        .eq("client_id", effectiveClientId)
        .eq("ad_account_id", newAccountId)
        .maybeSingle();

      if (existing) {
        toast.info("Esta conta já está conectada a este cliente.");
        setNewAccountId("");
        return;
      }

      // Inserir registro no banco
      const { error: insertError } = await supabase.from("meta_ad_accounts").insert({
        client_id: effectiveClientId,
        ad_account_id: newAccountId,
        ad_account_name: result?.data?.name || `Conta ${newAccountId}`,
        status: "active"
      });

      if (insertError) {
        console.error("[MetaAccountManager] Erro ao inserir:", insertError);
        throw new Error(insertError.message);
      }

      toast.success("Conta do Meta Ads conectada com sucesso!");
      setNewAccountId("");
      fetchAccounts();
    } catch (error: any) {
      console.error("[MetaAccountManager] Erro completo:", error);
      toast.error(error.message || "Falha ao conectar conta do Meta Ads. Verifique o ID e tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from("meta_ad_accounts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Conta removida com sucesso");
      fetchAccounts();
    } catch (error: any) {
      console.error("[MetaAccountManager] Erro ao remover:", error);
      toast.error("Erro ao remover conta");
    }
  };

  const handleSyncNow = async () => {
    if (!effectiveClientId) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-meta-ads", {
        body: { client_id: effectiveClientId },
      });

      if (error) {
        console.error("[MetaAccountManager] Erro ao sincronizar:", error);
        throw error;
      }

      console.log("[MetaAccountManager] Resposta do sync:", data);

      toast.success("Sincronização concluída com sucesso!");
      fetchAccounts(); 
    } catch (error: any) {
      console.error("[MetaAccountManager] Erro ao sincronizar:", error);
      toast.error("Erro ao sincronizar dados. Tente novamente em instantes.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Encontrar nome do cliente selecionado para exibir
  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name;
  const showClientSelector = !clientId || clientId === "all";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 gap-2">
          <Link2 className="h-4 w-4" />
          Gerenciar Contas Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Métricas de Tráfego - Meta Ads
          </DialogTitle>
          <DialogDescription>
            Conecte o ID da conta de anúncios do cliente para puxar as métricas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Seletor de cliente (quando não há filtro ativo) */}
          {showClientSelector && (
            <div className="space-y-2">
              <Label className="font-semibold">Selecionar Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedClientId && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                  ⚠️ Selecione um cliente acima para gerenciar as contas de anúncio.
                </p>
              )}
            </div>
          )}

          {/* Formulário de adição - só aparece com cliente selecionado */}
          {effectiveClientId && (
            <>
              <div className="space-y-3">
                <Label>Adicionar Nova Conta</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: act_123456789 ou 123456789"
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newAccountId.trim() && !isVerifying) {
                        handleConnect();
                      }
                    }}
                  />
                  <Button onClick={handleConnect} disabled={isVerifying || !newAccountId.trim()}>
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Conectar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A conta deve estar associada à Business Manager da Agência CAEN.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Contas Conectadas {selectedClientName ? `— ${selectedClientName}` : ''}</Label>
                  {accounts.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSyncNow} 
                      disabled={isSyncing}
                      className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>
                  )}
                </div>
                {isLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : accounts.length === 0 ? (
                  <div className="text-sm text-center py-6 text-muted-foreground bg-slate-50 rounded-md border border-dashed">
                    Nenhuma conta conectada para este cliente.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {accounts.map((account) => (
                      <li key={account.id} className="flex items-center justify-between p-3 rounded-md border text-sm bg-white">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900">{account.ad_account_name || account.ad_account_id}</p>
                            <p className="text-xs text-muted-foreground">ID: {account.ad_account_id}</p>
                            {account.last_sync_at && (
                              <p className="text-xs text-blue-500">
                                Último sync: {new Date(account.last_sync_at).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(account.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
