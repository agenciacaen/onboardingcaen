import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Loader2, Plus, Image as ImageIcon, FileVideo, CheckCircle, XCircle, Clock, Grid, List, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Creative {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  status: "pending" | "approved" | "rejected";
  feedback: string | null;
  created_at: string;
}

export function AgencyApprovalsTab({ clientId }: { clientId: string }) {
  const { user } = useAuthStore();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCreatives();
  }, [clientId]);

  const fetchCreatives = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_approvals")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar criativos");
      console.error(error);
    } else {
      setCreatives(data as Creative[]);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !user) {
      toast.error("Preencha título e selecione um arquivo.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('creative_assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('creative_assets')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'document';

      const { error: dbError } = await supabase
        .from('post_approvals')
        .insert({
          client_id: clientId,
          title,
          description,
          file_url: publicUrlData.publicUrl,
          file_type: fileType,
          file_path: fileName,
          created_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Criativo enviado com sucesso!");
      setOpenModal(false);
      setFile(null);
      setTitle("");
      setDescription("");
      fetchCreatives();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const statusMap = {
    pending: { label: "Pendente", icon: Clock, color: "text-amber-500 bg-amber-50" },
    approved: { label: "Aprovado", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    rejected: { label: "Reprovado", icon: XCircle, color: "text-red-500 bg-red-50" },
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <div>
          <h3 className="text-xl font-bold">Aprovações de Criativos</h3>
          <p className="text-sm text-muted-foreground">Envie posts e imagens para o cliente aprovar.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-md">
            <button
              title="Visualização em Grade"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              title="Visualização em Lista"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" /> Novo Envio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Criativo para Aprovação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Post / Criativo</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Post Carrossel Dia das Mães" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição / Copy (Opcional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Texto da legenda ou instruções..." />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo (Imagem ou Vídeo)</Label>
                  <Input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                    required 
                  />
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirmar Envio
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-lg font-medium text-slate-600">Nenhum criativo enviado</h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Faça o upload do primeiro material para o cliente aprovar.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatives.map(creative => {
            const StatusIcon = statusMap[creative.status].icon;
            return (
              <div key={creative.id} className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow flex flex-col">
                <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden group">
                  {creative.file_type === 'image' ? (
                    <img src={creative.file_url} alt={creative.title} className="w-full h-full object-cover" />
                  ) : (
                    <video src={creative.file_url} className="w-full h-full object-cover" controls />
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusMap[creative.status].color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusMap[creative.status].label}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-semibold text-slate-800 line-clamp-1">{creative.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{creative.description || "Sem descrição"}</p>
                  
                  {creative.feedback && (
                    <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100 flex gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-600 block">Feedback do Cliente:</span>
                        <p className="text-xs text-slate-700 italic">{creative.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Título / Descrição</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creatives.map(creative => {
                const StatusIcon = statusMap[creative.status].icon;
                return (
                  <tr key={creative.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 w-16">
                      <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                        {creative.file_type === 'image' ? (
                          <img src={creative.file_url} alt={creative.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{creative.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 truncate max-w-[200px]">{creative.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold items-center gap-1 ${statusMap[creative.status].color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusMap[creative.status].label}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                       <p className="text-xs text-slate-600 italic line-clamp-2">{creative.feedback || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(creative.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
