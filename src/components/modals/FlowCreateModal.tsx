import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface FlowCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FlowCreateModal({ open, onOpenChange, onSuccess }: FlowCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    
    // Default flow logic steps (simulated initial JSON)
    const initialSteps = [
       { id: "1", type: "trigger", title: "Cliente Cadastrado" },
       { id: "2", type: "action", title: "Disparar Boas-vindas" }
    ];

    try {
      const { error } = await supabase.from('flows').insert({
        name,
        description,
        steps: initialSteps,
        status: 'draft',
      });

      if (error) throw error;

      toast.success("Fluxo inicial criado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar fluxo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Fluxo Automático</DialogTitle>
          <DialogDescription>
             Este painel cria a raiz do fluxo. A edição Node-Based ocorrerá na página de detalhes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          
          <div className="grid w-full items-center gap-1.5">
            <Label>Nome do Fluxo</Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Onboarding Especialista" 
              required 
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label>Descrição / Objetivo</Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="O que esse fluxo dispara..." 
              required 
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Base do Fluxo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
