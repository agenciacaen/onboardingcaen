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
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const createEventSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  event_date: z.string(),
  event_type: z.enum(['post', 'story', 'live', 'meeting', 'tarefa']),
  platform: z.string().optional(),
  client_id: z.string().min(1, "Selecione o cliente"),
  color: z.string().optional(),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

interface EventCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess: () => void;
}

export function EventCreateModal({
  open,
  onOpenChange,
  initialDate,
  onSuccess,
}: EventCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      color: "#3b82f6",
      event_type: "post",
    }
  });

  const fetchClients = useCallback(async () => {
    const { data } = await supabase.from("clients").select("id, name");
    if (data) setClients(data);
  }, []);

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        event_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        event_type: 'post',
        platform: '',
        color: '#3b82f6',
      });
      fetchClients();
    }
  }, [open, initialDate, reset, fetchClients]);

  const clientId = watch("client_id");
  const eventType = watch("event_type");

  const onSubmit = async (data: CreateEventFormValues) => {
    setLoading(true);
    try {
      if (data.event_type === 'tarefa') {
        const { error } = await supabase.from('tasks').insert({
          title: data.title,
          client_id: data.client_id,
          module: 'general',
          status: 'todo',
          priority: 'medium',
          due_date: data.event_date
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('social_calendar_events').insert({
          title: data.title,
          client_id: data.client_id,
          event_date: data.event_date,
          event_type: data.event_type,
          platform: data.platform,
          color: data.color
        });
        if (error) throw error;
      }
      toast.success("Evento criado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar evento";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label>Título</Label>
            <Input {...register("title")} placeholder="Ex: Post de Vendas..." />
            {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>Data</Label>
              <Input type="date" {...register("event_date")} />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label>Tipo de Evento</Label>
              <Select 
                value={eventType} 
                onValueChange={(val: 'post' | 'story' | 'live' | 'meeting' | 'tarefa') => setValue("event_type", val)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="tarefa">Tarefa do Board</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Cliente</Label>
            <Select 
              value={clientId} 
              onValueChange={(val) => setValue("client_id", val)}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.client_id && <span className="text-xs text-red-500">{errors.client_id.message}</span>}
          </div>

          {eventType !== 'tarefa' && (
            <div className="grid grid-cols-2 gap-4">
               <div className="grid w-full items-center gap-1.5">
                  <Label>Plataforma</Label>
                  <Input {...register("platform")} placeholder="Instagram, FB..." />
               </div>
               <div className="grid w-full items-center gap-1.5">
                  <Label>Cor Padrão</Label>
                  <Input type="color" {...register("color")} className="p-1 h-9" />
               </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
