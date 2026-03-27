import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from "lucide-react";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DocumentUploadModal({ open, onOpenChange, onSuccess }: DocumentUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [docType, setDocType] = useState('contract');
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchClients();
      setClientId("");
      setDocType("contract");
      setFile(null);
    }
  }, [open]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name");
    if (data) setClients(data as { id: string; name: string }[]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Selecione um arquivo primeiro.");
    if (!clientId) return toast.error("Selecione qual cliente pertence o documento.");

    setLoading(true);
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agency_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agency_documents')
        .getPublicUrl(filePath);

      // 3. Save to database
      const { error: dbError } = await supabase.from('documents').insert({
        client_id: clientId,
        title: file.name,
        doc_type: docType,
        file_url: publicUrl
      });

      if (dbError) throw dbError;

      toast.success("Documento salvo com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Falha no upload";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 pt-2">
          
           <div 
             role="button"
             tabIndex={0}
             aria-label="Área de upload de arquivo"
             className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
             onClick={() => fileInputRef.current?.click()}
             onKeyDown={handleKeyDown}
           >
               <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
               <p className="text-sm text-slate-600 font-medium">
                 {file ? file.name : "Clique aqui para subir o arquivo"}
               </p>
               {file && <p className="text-xs text-primary mt-1">{(file.size / 1024).toFixed(2)} KB</p>}
           </div>

           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             aria-label="Selecionar arquivo"
             title="Selecionar arquivo"
             onChange={e => setFile(e.target.files?.[0] || null)}
           />

          <div className="grid w-full items-center gap-1.5 pt-2">
            <Label>Cliente Pertencente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Tipo de Documento</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="briefing">Briefing</SelectItem>
                <SelectItem value="report">Relatório Assinado</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !file}>
                {loading ? "Salvando..." : "Salvar Arquivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
