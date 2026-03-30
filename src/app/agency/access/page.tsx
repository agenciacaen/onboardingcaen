import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  ExternalLink, 
  User, 
  Key, 
  Edit2, 
  Trash2,
  Globe,
  Camera,
  Share2,
  MessageCircle,
  MoreVertical
} from "lucide-react";
import type { ClientCredential } from "@/types/general.types";
import { CredentialModal } from "@/components/modals/CredentialModal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  logo_url: string | null;
}

export function AgencyAccessPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [credentials, setCredentials] = useState<ClientCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ClientCredential | null>(null);

  const fetchCredentials = useCallback(async (clientId: string) => {
    const { data } = await supabase
      .from("client_credentials")
      .select("*")
      .eq("client_id", clientId)
      .order("platform");
    
    if (data) setCredentials(data);
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, logo_url")
      .order("name");
    
    if (data) {
      const typedData = data as Client[];
      setClients(typedData);
      setSelectedClient(prev => prev || typedData[0] || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClient?.id) {
      fetchCredentials(selectedClient.id);
    } else {
      setCredentials([]);
    }
  }, [selectedClient, fetchCredentials]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este acesso?")) return;

    const { error } = await supabase
      .from("client_credentials")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Erro ao excluir.");
    } else {
      toast.success("Excluído com sucesso.");
      if (selectedClient?.id) {
        fetchCredentials(selectedClient.id);
      }
    }
  };

  const openEditModal = (cred: ClientCredential) => {
    setEditingCredential(cred);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("inst")) return <Camera className="w-4 h-4 text-pink-500" />;
    if (p.includes("face")) return <Share2 className="w-4 h-4 text-blue-600" />;
    if (p.includes("goog") || p.includes("ads")) return <Globe className="w-4 h-4 text-blue-400" />;
    if (p.includes("whats")) return <MessageCircle className="w-4 h-4 text-green-500" />;
    return <Key className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader 
        title="Gestão de Acessos" 
        description="Gerencie credenciais e links de redes sociais por cliente"
        className="mb-0"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Lista de Clientes */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 border-t">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Carregando...</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">Nenhum cliente encontrado.</div>
              ) : (
                <div className="divide-y relative">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedClient?.id === client.id ? "bg-slate-50 border-r-4 border-primary" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {client.logo_url ? (
                          <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="font-medium text-sm truncate">{client.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes de Acesso */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {selectedClient ? `Acessos: ${selectedClient.name}` : "Selecione um cliente"}
                  </CardTitle>
                </div>
              </div>
              {selectedClient && (
                <Button onClick={openAddModal} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Acesso
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {!selectedClient ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <ShieldCheck className="w-12 h-12 opacity-20" />
                  <p>Selecione um cliente ao lado para ver as credenciais</p>
                </div>
              ) : credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <Key className="w-12 h-12 opacity-20" />
                  <p>Nenhuma credencial cadastrada para este cliente.</p>
                  <Button variant="ghost" onClick={openAddModal} className="mt-2">Começar agora</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
                  {credentials.map((cred) => (
                    <Card key={cred.id} className="relative group overflow-hidden border-slate-200">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-md bg-slate-100">
                            {getPlatformIcon(cred.platform)}
                          </div>
                          <h3 className="font-semibold text-slate-900">{cred.platform}</h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(cred)}>
                              <Edit2 className="mr-2 w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(cred.id)} className="text-destructive focus:text-destructive border-t">
                              <Trash2 className="mr-2 w-4 h-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-3">
                          {cred.url && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a 
                                href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                {cred.url.replace(/^https?:\/\//, '')}
                              </a>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                          
                          <div className="bg-slate-50 rounded-md p-3 space-y-2 border border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Usuário</span>
                              <span className="text-sm font-medium text-slate-700 truncate">{cred.username || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Senha</span>
                              <span className="text-sm font-mono text-slate-700 break-all">{cred.password || "—"}</span>
                            </div>
                          </div>

                          {cred.notes && (
                            <div className="mt-2 p-2 bg-slate-50/50 rounded text-xs text-slate-500 italic border-l-2 border-slate-200">
                              “{cred.notes}”
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedClient && (
        <CredentialModal 
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={() => fetchCredentials(selectedClient.id)}
          clientId={selectedClient.id}
          credential={editingCredential}
        />
      )}
    </div>
  );
}
