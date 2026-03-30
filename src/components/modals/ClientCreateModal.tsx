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
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createClientSchema = z.object({
  name: z.string().min(2, "Nome fantasia deve ter pelo menos 2 caracteres."),
  legal_name: z.string().optional(),
  cnpj: z.string().optional(),
  email: z.string().email("Email inválido."),
  phone: z.string().optional(),
  assigned_to: z.string().optional(),
  traffic: z.boolean().optional(),
  social: z.boolean().optional(),
  web: z.boolean().optional(),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface ClientCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: ClientCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<{ id: string; full_name: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      email: "",
      assigned_to: "",
      traffic: false,
      social: false,
      web: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset();
      fetchAdmins();
    }
  }, [open, reset]);

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "member"]);
    if (data) setAdmins(data);
  };

  const traffic = watch("traffic");
  const social = watch("social");
  const web = watch("web");
  const assigned_to = watch("assigned_to");

  const onSubmit = async (data: CreateClientFormValues) => {
    setLoading(true);
    try {
      // Create Client Record directly (in this system, the auth trigger handles profiles usually, but for clients maybe we just create the record and manually create the client profile later using Edge Function or RPC if necessary, or just rely on clients table)
      const { error } = await supabase
        .from("clients")
        .insert({
          name: data.name,
          legal_name: data.legal_name,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.phone,
          status: "onboarding", // Initial Status
          assigned_to: data.assigned_to || null,
          modules_enabled: {
            traffic: data.traffic,
            social: data.social,
            web: data.web,
          },
          onboarding_step: 0,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Cliente criado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro ao criar cliente";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Nome Fantasia *</Label>
            <Input id="name" placeholder="Ex: Acme Corp" {...register("name")} />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="contato@acme.com" {...register("email")} />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="legal_name">Razão Social</Label>
              <Input id="legal_name" {...register("legal_name")} />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" {...register("cnpj")} />
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="assigned_to">Responsável (Admin)</Label>
            <Select 
              value={assigned_to} 
              onValueChange={(val) => setValue("assigned_to", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro..." />
              </SelectTrigger>
              <SelectContent>
                {admins.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
