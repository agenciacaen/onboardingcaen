import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ClientFilterBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientFilterBar({ value, onChange }: ClientFilterBarProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .in('status', ['active', 'onboarding']);
      if (data) setClients(data);
    }
    fetchClients();
  }, []);

  return (
    <div className="flex items-center space-x-2 w-[250px]">
      <Label className="whitespace-nowrap">Filtrar Cliente:</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todos os Clientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Clientes</SelectItem>
          {clients.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
