import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { ClientCreateModal } from "@/components/modals/ClientCreateModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { type ClientWithProfile } from "@/types/client.types";
import { ClientCard } from "@/components/cards/ClientCard";

export function ClientListPage() {
  const [data, setData] = useState<ClientWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [financials, setFinancials] = useState<Record<string, number>>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("clients")
      .select(`
        id, name, email, status, modules_enabled, assigned_to,
        profiles!clients_assigned_to_fkey ( full_name )
      `)
      .is('deleted_at', null);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      toast.error("Erro ao buscar clientes.");
      console.error(error);
    } else {
      const formatted = (clients || []).map((c) => {
        const row = c as Record<string, unknown>;
        const profiles = row.profiles;
        return {
          ...row,
          profiles: Array.isArray(profiles) ? profiles[0] : profiles
        };
      });
      setData(formatted as ClientWithProfile[]);

      const clientIds = (clients || []).map(c => c.id);
      if (clientIds.length > 0) {
        const { data: finData } = await supabase
          .from('financial_invoices')
          .select('client_id, amount')
          .in('client_id', clientIds)
          .eq('status', 'pending');

        const summary: Record<string, number> = {};
        finData?.forEach(f => {
          summary[f.client_id] = (summary[f.client_id] || 0) + (f.amount || 0);
        });
        setFinancials(summary);
      }
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      await fetchClients();
    };
    load();
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <PageHeader 
          title="Gestão de Clientes" 
          description="Acompanhe o status, módulos e detalhes dos seus clientes."
        />
        <Button onClick={() => setCreateModalOpen(true)}>Novo Cliente</Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-[400px] w-full" />
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              pendingAmount={financials[client.id] || 0}
            />
          ))}
        </div>
      )}

      <ClientCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchClients} 
      />
    </div>
  );
}
