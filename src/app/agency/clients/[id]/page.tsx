import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientEditModal } from "@/components/modals/ClientEditModal";

import { type Client } from "@/types/general.types";

export function AgencyClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        profiles ( full_name, email )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao encontrar detalhes do cliente.");
      console.error(error);
    } else {
      setClient(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (isMounted) fetchClient();
    };
    void load();
    return () => { isMounted = false; };
  }, [fetchClient]);

  if (loading) {
    return <LoadingSkeleton className="h-[400px] w-full" />;
  }

  if (!client) {
    return <div>Cliente não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <PageHeader 
            title={client.name} 
            description={client.email}
          />
          <div className="mt-2">
            <StatusBadge status={client.status} />
          </div>
        </div>
        <Button onClick={() => setEditModalOpen(true)}>Editar Cliente</Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          {client.modules_enabled.traffic && <TabsTrigger value="traffic">Tráfego</TabsTrigger>}
          {client.modules_enabled.social && <TabsTrigger value="social">Social</TabsTrigger>}
          {client.modules_enabled.web && <TabsTrigger value="web">Web</TabsTrigger>}
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="border rounded p-4 bg-muted/20">
            <h3 className="font-semibold text-lg mb-2">Dados Cadastrais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-sm">Razão Social</span>
                <span>{client.legal_name || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">CNPJ</span>
                <span>{client.cnpj || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">Telefone</span>
                <span>{client.phone || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">Responsável Atual</span>
                <span>{client.profiles?.full_name || "Ninguém"}</span>
              </div>
            </div>
          </div>
        </TabsContent>
        {client.modules_enabled.traffic && (
          <TabsContent value="traffic">Preview de Tráfego Aqui</TabsContent>
        )}
        {client.modules_enabled.social && (
          <TabsContent value="social">Preview Social Aqui</TabsContent>
        )}
        {client.modules_enabled.web && (
          <TabsContent value="web">Preview Web Aqui</TabsContent>
        )}
        <TabsContent value="tasks">Listagem de tarefas vinculadas</TabsContent>
        <TabsContent value="documents">Arquivos enviados</TabsContent>
      </Tabs>

      <ClientEditModal 
        client={client}
        open={isEditModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={fetchClient}
      />
    </div>
  );
}
