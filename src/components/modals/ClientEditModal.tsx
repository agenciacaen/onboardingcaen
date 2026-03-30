import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2 } from "lucide-react";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Client } from "@/types/client.types";
import { useCallback } from "react";


const editClientSchema = z.object({
  name: z.string().min(2, "Nome fantasia deve ter pelo menos 2 caracteres."),
  legal_name: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email("Email inválido."),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'onboarding']),
  assigned_to: z.string().optional().nullable(),
  traffic: z.boolean(),
  social: z.boolean(),
  web: z.boolean(),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

interface ClientEditModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientEditModal({
  client,
  open,
  onOpenChange,
  onSuccess,
}: ClientEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<{ id: string; full_name: string }[]>([]);
  
  // States de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
  });

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin");
    if (data) setAdmins(data);
  }, []);

  useEffect(() => {
    if (open && client) {
      reset({
        name: client.name || "",
        legal_name: client.legal_name || "",
        cnpj: client.cnpj || "",
        email: client.email || "",
        phone: client.phone || "",
        status: client.status || "onboarding",
        assigned_to: client.assigned_to || "",
        traffic: !!client.modules_enabled?.traffic,
        social: !!client.modules_enabled?.social,
        web: !!client.modules_enabled?.web,
      });
      fetchAdmins();
    }
  }, [open, client, reset, fetchAdmins]);

  const traffic = watch("traffic");
  const social = watch("social");
  const web = watch("web");
  const status = watch("status");
  const assigned_to = watch("assigned_to");

  const onSubmit = async (data: EditClientFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          legal_name: data.legal_name,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.phone,
          status: data.status,
          assigned_to: data.assigned_to || null,
          modules_enabled: {
            traffic: data.traffic,
            social: data.social,
            web: data.web,
          },
        })
        .eq("id", client?.id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro ao atualizar cliente";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (deleteConfirmText !== "EXCLUIR") {
      toast.error("Você precisa digitar EXCLUIR para confirmar.");
      return;
    }
    if (!client) return;
    setDeleting(true);
    try {
      // Exclui fisicamente do Supabase. As Foreign Keys já foram atualizadas para ON DELETE CASCADE
      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) throw error;

      toast.success("Cliente e todos os seus vínculos excluídos com sucesso!");
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess(); // disparará atualização da lista na página
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro ao excluir cliente.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Nome Fantasia *</Label>
            <Input id="name" placeholder="Ex: Acme Corp" {...register("name")} />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(val: 'active' | 'inactive' | 'onboarding') => setValue("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="assigned_to">Responsável</Label>
                <Select 
                value={assigned_to || undefined} 
                onValueChange={(val) => setValue("assigned_to", val)}
                >
                <SelectTrigger>
                    <SelectValue placeholder="Membro..." />
                </SelectTrigger>
                <SelectContent>
                    {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label>Módulos Ativos</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="traffic" checked={traffic} onCheckedChange={(val) => setValue("traffic", val as boolean)} />
                <label htmlFor="traffic" className="text-sm font-medium leading-none">Tráfego</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="social" checked={social} onCheckedChange={(val) => setValue("social", val as boolean)} />
                <label htmlFor="social" className="text-sm font-medium leading-none">Social</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="web" checked={web} onCheckedChange={(val) => setValue("web", val as boolean)} />
                <label htmlFor="web" className="text-sm font-medium leading-none">Web</label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between w-full sm:justify-between items-center mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeleteConfirmText("");
                setIsDeleteDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">⚠ Atenção Crítica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-700 font-medium">Você está preste a deletar irreversivelmente:</p>
          <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 bg-red-50 p-3 rounded-lg border border-red-100">
            <li>O cliente <strong>{client?.name}</strong></li>
            <li>Todas as Métricas, Anúncios e Campanhas</li>
            <li>Todos os Cards, Tasks, Subtasks e Comentários dele</li>
            <li>Todas as Aprovações de Social Media e Relatórios</li>
          </ul>
          <p className="text-sm">Esta ação <strong>NÃO</strong> pode ser desfeita. Digite <strong>EXCLUIR</strong> para confirmar.</p>
          
          <Input 
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="border-red-300 focus-visible:ring-red-500"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteClient} 
            disabled={deleteConfirmText !== "EXCLUIR" || deleting}
          >
            {deleting ? "Excluindo..." : "Confirmar Exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
