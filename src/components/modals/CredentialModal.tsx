import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import type { ClientCredential } from "@/types/general.types";

interface CredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clientId: string;
  credential?: ClientCredential | null;
}

export function CredentialModal({ open, onOpenChange, onSuccess, clientId, credential }: CredentialModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    platform: "",
    url: "",
    username: "",
    password: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      if (credential) {
        setFormData({
          platform: credential.platform || "",
          url: credential.url || "",
          username: credential.username || "",
          password: credential.password || "",
          notes: credential.notes || ""
        });
      } else {
        setFormData({
          platform: "",
          url: "",
          username: "",
          password: "",
          notes: ""
        });
      }
    }
  }, [open, credential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform) return toast.error("A plataforma é obrigatória.");
    if (!clientId) return toast.error("ID do cliente não encontrado.");

    setLoading(true);
    try {
      if (credential) {
        // Update
        const { error } = await supabase
          .from("client_credentials")
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq("id", credential.id);

        if (error) throw error;
        toast.success("Acesso atualizado com sucesso!");
      } else {
        // Insert
        const { error } = await supabase
          .from("client_credentials")
          .insert({
            ...formData,
            client_id: clientId
          });

        if (error) throw error;
        toast.success("Acesso adicionado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar credencial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{credential ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc-platform">Plataforma / Rede Social</Label>
            <Input
              id="cc-platform"
              placeholder="Ex: Instagram, Facebook, TikTok..."
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc-url">URL (Link)</Label>
            <Input
              id="cc-url"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc-username">Usuário / Email</Label>
            <Input
              id="cc-username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc-password">Senha</Label>
            <Input
              id="cc-password"
              type="text" // Campo de texto para facilitar visualização direta
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc-notes">Notas / Observações</Label>
            <Textarea
              id="cc-notes"
              placeholder="Instruções adicionais..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
