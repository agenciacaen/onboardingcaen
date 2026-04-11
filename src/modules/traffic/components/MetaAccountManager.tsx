import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckCircle2, RefreshCw } from "lucide-react";

interface MetaAccountManagerProps {
  clientId: string;
}

export function MetaAccountManager({ clientId }: MetaAccountManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newAccountId, setNewAccountId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("meta_ad_accounts")
      .select("*")
      .eq("client_id", clientId);

    if (error) {
      console.error(error);
    } else {
      setAccounts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && clientId && clientId !== "all") {
      fetchAccounts();
    }
  }, [isOpen, clientId]);

  const handleConnect = async () => {
    if (!newAccountId.trim()) return;

    setIsVerifying(true);
    try {
      // Chamada para a Edge Function de validação
      const { data: result, error } = await supabase.functions.invoke("meta-validate-account", {
        body: { ad_account_id: newAccountId },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      // Inserir registro no banco
      const { error: insertError } = await supabase.from("meta_ad_accounts").insert({
        client_id: clientId,
        ad_account_id: newAccountId,
        ad_account_name: result.data?.name || `Conta ${newAccountId}`,
        status: "active"
      });

      if (insertError) throw insertError;

      toast.success("Conta do Meta Ads conectada com sucesso!");
      setNewAccountId("");
      fetchAccounts();
    } catch (error: any) {
      console.error(error);
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
      console.error(error);
      toast.error("Erro ao remover conta");
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-meta-ads", {
        body: { client_id: clientId },
      });

      if (error) throw error;
      
      toast.success("Sincronização concluída com sucesso!");
      fetchAccounts(); 
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao sincronizar dados. Tente novamente em instantes.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
          Gerenciar Contas Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Métricas de Tráfego - Meta Ads</DialogTitle>
          <DialogDescription>
            Conecte o ID da conta de anúncios do cliente para puxar as métricas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <Label>Adicionar Nova Conta</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: act_123456789 ou 123456789"
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
              />
              <Button onClick={handleConnect} disabled={isVerifying || !newAccountId.trim()}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Conectar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A conta deve estar associada à Business Manager da Agência.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Contas Conectadas</Label>
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
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-slate-900">{account.ad_account_name || account.ad_account_id}</p>
                        <p className="text-xs text-muted-foreground">ID: {account.ad_account_id}</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
