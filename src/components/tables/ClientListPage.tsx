import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/services/supabase";
import { DataTable } from "@/components/tables/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { ClientCreateModal } from "@/components/modals/ClientCreateModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { type ClientWithProfile } from "@/types/client.types";


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
      // Garantir que profiles seja um objeto simples se vier como array
      const formatted = (clients || []).map((c) => {
        const row = c as Record<string, unknown>;
        const profiles = row.profiles;
        return {
          ...row,
          profiles: Array.isArray(profiles) ? profiles[0] : profiles
        };
      });
      setData(formatted as ClientWithProfile[]);
      
      // Fetch financial summary
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


  const columns = useMemo<ColumnDef<ClientWithProfile>[]>(() => [
    {
      accessorKey: "name",
      header: "Nome da Empresa",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "modules_enabled",
      header: "Módulos",
      cell: ({ row }) => {
        const mods = row.original.modules_enabled;
        if (!mods) return "-";
        const parts = [];
        if (mods.traffic) parts.push("Tráfego");
        if (mods.social) parts.push("Social");
        if (mods.web) parts.push("Web");
        if (mods.crm) parts.push("CRM");
        if (mods.approvals) parts.push("Aprovações");
        if (mods.financial) parts.push("Financeiro");
        if (mods.documents) parts.push("Docs");
        if (mods.support) parts.push("Suporte");
        return parts.join(", ");
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Responsável",
      cell: ({ row }) => row.original.profiles?.full_name || "Não atribuído",
    },
    {
      id: "balance",
      header: "Pendente",
      cell: ({ row }) => {
        const amount = financials[row.original.id] || 0;
        return (
          <span className={amount > 0 ? "text-amber-600 font-bold" : "text-green-600"}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
          </span>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/agency/clients/${row.original.id}`}>Ver Detalhes</Link>
          </Button>
        );
      },
    },
  ], [financials]);

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
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      <ClientCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchClients} 
      />
    </div>
  );
}
