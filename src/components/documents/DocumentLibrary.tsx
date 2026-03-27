import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { DataTable } from "@/components/tables/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

type DocumentItem = {
  id: string;
  title: string;
  doc_type: string;
  file_url: string;
  created_at: string;
  clients: { name: string };
};

interface DocumentRow {
  id: string;
  title: string;
  doc_type: string;
  file_url: string;
  created_at: string;
  clients: { name: string } | { name: string }[];
}

export function DocumentLibrary({ clientIdFilter }: { clientIdFilter?: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("documents")
      .select(`
         id, title, doc_type, file_url, created_at,
         clients ( name )
      `)
      .order('created_at', { ascending: false });

    if (clientIdFilter) { // Changed from clientIdFilter && clientIdFilter !== 'all'
      query = query.eq('client_id', clientIdFilter);
    }

    const { data, error } = await query; // Added error

    if (error) { // Added error handling
      toast.error("Erro ao carregar documentos");
    } else {
      // Supabase join can return an array even for 1-1 if not flattened
      const formattedData = (data as unknown as DocumentRow[] || []).map((doc) => ({
        ...doc,
        clients: Array.isArray(doc.clients) ? doc.clients[0] : doc.clients
      }));
      setDocuments(formattedData as DocumentItem[]);
    }
    setLoading(false);
  }, [clientIdFilter]);

  useEffect(() => {
    const load = async () => {
      await fetchDocuments();
    };
    load();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
       toast.success("Documento excluído");
       fetchDocuments();
    } else {
       toast.error("Erro interno. Apenas admins.");
    }
  };

  const columns: ColumnDef<DocumentItem>[] = [
    {
      accessorKey: "title",
      header: "Arquivo",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-3 max-w-[300px]">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
               <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <div className="truncate font-medium text-slate-800" title={row.original.title}>
              {row.original.title}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "clients.name",
      header: "Cliente",
      cell: ({ row }) => <span className="text-slate-500">{row.original.clients?.name || 'Geral'}</span>
    },
    {
      accessorKey: "doc_type",
      header: "Tipo",
      cell: ({ row }) => <span className="uppercase text-xs font-bold text-slate-400">{row.original.doc_type}</span>
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('pt-BR'),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2 justify-end">
             <Button variant="ghost" size="icon" asChild title="Visualizar documento">
                <a href={row.original.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4" />
                  <span className="sr-only">Visualizar documento</span>
                </a>
             </Button>
             <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(row.original.id)} title="Excluir documento">
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Excluir documento</span>
             </Button>
          </div>
        )
      }
    }
  ];

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
