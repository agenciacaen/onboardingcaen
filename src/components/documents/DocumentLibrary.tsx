import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { DataTable } from "@/components/tables/DataTable";
import { type ColumnDef, type CellContext } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Trash2, Link as LinkIcon, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type DocumentItem = {
  id: string;
  title: string;
  file_type?: string;
  category: string;
  file_url: string;
  created_at: string;
  clients: { name: string };
};

const CATEGORY_LABELS: Record<string, string> = {
  contract: 'Contrato',
  draft: 'Minuta',
  brief: 'Briefing',
  report: 'Relatório',
  creative: 'Criativo',
  other: 'Outros'
};

export function DocumentLibrary({ clientIdFilter }: { clientIdFilter?: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'member';

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("documents")
      .select(`
         id, title, file_type, category, file_url, created_at,
         clients ( name )
      `)
      .order('created_at', { ascending: false });

    if (clientIdFilter && clientIdFilter !== 'all') {
      query = query.eq('client_id', clientIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar documentos");
    } else {
      const formattedData = ((data as unknown as DocumentItem[]) || []).map((doc) => ({
        ...doc,
        clients: Array.isArray(doc.clients) ? doc.clients[0] : doc.clients
      }));
      setDocuments(formattedData as DocumentItem[]);
    }
    setLoading(false);
  }, [clientIdFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    
    setLoading(true);
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
       toast.success("Documento excluído");
       fetchDocuments();
    } else {
       toast.error("Erro interno. Apenas admins.");
       setLoading(false);
    }
  };

  const columns: ColumnDef<DocumentItem>[] = [
    {
      accessorKey: "title",
      header: "Arquivo",
      cell: ({ row }: CellContext<DocumentItem, unknown>) => {
        const doc = row.original;
        const isLink = doc.file_type === 'link';
        const isDraft = doc.category === 'draft';

        return (
          <div className="flex items-center space-x-3 max-w-[300px]">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLink ? 'bg-indigo-100' : 'bg-orange-100'}`}>
               {isLink ? (
                 <LinkIcon className="w-4 h-4 text-indigo-600" />
               ) : (
                 isDraft ? <FileSignature className="w-4 h-4 text-orange-600" /> : <FileText className="w-4 h-4 text-orange-600" />
               )}
            </div>
            <div className="truncate font-medium text-slate-800" title={doc.title}>
              {doc.title}
            </div>
          </div>
        );
      },
    },
    isAdmin ? {
      accessorKey: "clients.name",
      header: "Cliente",
      cell: ({ row }: CellContext<DocumentItem, unknown>) => <span className="text-slate-500">{row.original.clients?.name || 'Geral'}</span>
    } : {
      id: "client_name_hidden",
      header: "",
      cell: () => null,
      enableHiding: true
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }: CellContext<DocumentItem, unknown>) => (
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
          {CATEGORY_LABELS[row.original.category] || row.original.category}
        </span>
      )
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }: CellContext<DocumentItem, unknown>) => new Date(row.original.created_at).toLocaleDateString('pt-BR'),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: CellContext<DocumentItem, unknown>) => {
        return (
          <div className="flex space-x-2 justify-end">
             <Button variant="ghost" size="icon" asChild title="Visualizar documento">
                <a href={row.original.file_url} target="_blank" rel="noopener noreferrer" title={`Ver ${row.original.title}`}>
                   <Eye className="w-4 h-4" />
                </a>
             </Button>
             {isAdmin && (
               <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(row.original.id)} title="Excluir documento">
                  <Trash2 className="w-4 h-4" />
               </Button>
             )}
          </div>
        )
      }
    }
  ].filter(col => col.header !== "");

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {loading ? (
        <div className="p-8 text-center text-slate-500">Buscando repositório...</div>
      ) : (
        <DataTable columns={columns} data={documents} />
      )}
    </div>
  );
}
