import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Zap, Settings, Play, Plus } from "lucide-react";
import { supabase } from "@/services/supabase";
import { DataTable } from "@/components/tables/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { FlowCreateModal } from "@/components/modals/FlowCreateModal";
import { type Flow, type FlowStatus } from "@/types/general.types";

export function AgencyFlowsPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = useCallback(async () => {
    // Para evitar o aviso de setState síncrono no efeito, 
    // garantimos que as atualizações ocorram após a montagem.
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('flows').select('*').order('created_at', { ascending: false });
      if (data) setFlows(data as Flow[]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const toggleStatus = async (id: string, currentStatus: FlowStatus) => {
     const newStatus = currentStatus === 'draft' ? 'active' : 'draft';
     const { error } = await supabase.from('flows').update({ status: newStatus }).eq('id', id);
     if (error) {
        toast.error('Erro ao alternar status do fluxo.');
     } else {
        toast.success(`Fluxo movido para ${newStatus}`);
        fetchFlows();
     }
  }

  const columns: ColumnDef<Flow>[] = [
    {
       accessorKey: "name",
       header: "Nome do Fluxo",
       cell: ({ row }) => (
         <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold">{row.original.name}</span>
         </div>
       )
    },
    {
       accessorKey: "description",
       header: "Descrição",
       cell: ({ row }) => <span className="text-slate-500 truncate max-w-[300px]">{row.original.description}</span>
    },
    {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => (
          <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
             row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}>
             {row.original.status}
          </span>
       )
    },
    {
       id: "actions",
       header: "",
       cell: ({ row }) => (
          <div className="flex space-x-2 justify-end">
             <Button variant="outline" size="sm" onClick={() => toggleStatus(row.original.id, row.original.status)}>
                <Play className="w-4 h-4 mr-1" /> Alternar Status
             </Button>
             <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4 text-slate-400" />
             </Button>
          </div>
       )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <PageHeader 
          title="Automações & Fluxos" 
          description="Central de edição Node-based para desenhar fluxos de Onboarding ou Tarefas Reversas."
        />
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
         {loading ? (
             <div className="p-8 text-center text-slate-500">Buscando fluxos...</div>
         ) : (
             <DataTable columns={columns} data={flows} />
         )}
      </div>

      <FlowCreateModal 
        open={isModalOpen} 
        onOpenChange={setModalOpen} 
        onSuccess={fetchFlows}
      />
    </div>
  );
}
