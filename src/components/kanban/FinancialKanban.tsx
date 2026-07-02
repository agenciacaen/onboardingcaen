import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DollarSign, CalendarDays, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { FinancialInvoice } from "@/types/general.types";

interface FinancialKanbanProps {
  clientId?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  statusFilter: string[];
}

const columns: KanbanColumn[] = [
  { id: "on_time", title: "Em Dia", color: "text-emerald-600 dark:text-emerald-400", borderColor: "border-emerald-500/30", bgColor: "bg-emerald-500/5", statusFilter: ["pending"] },
  { id: "pending", title: "Pendente", color: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-500/30", bgColor: "bg-amber-500/5", statusFilter: ["pending"] },
  { id: "overdue", title: "Atrasado", color: "text-red-600 dark:text-red-400", borderColor: "border-red-500/30", bgColor: "bg-red-500/5", statusFilter: ["overdue"] },
  { id: "paid", title: "Pago", color: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-500/30", bgColor: "bg-blue-500/5", statusFilter: ["paid"] },
];

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function getColumnForInvoice(invoice: FinancialInvoice): string {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "overdue") return "overdue";
  if (isOverdue(invoice.due_date)) return "overdue";
  if (invoice.status === "pending") {
    const diffDays = Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 5) return "pending";
    return "on_time";
  }
  return "on_time";
}

export function FinancialKanban({ clientId }: FinancialKanbanProps) {
  const [invoices, setInvoices] = useState<FinancialInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("financial_invoices")
      .select("*")
      .order("due_date", { ascending: true });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar faturas.");
      console.error(error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "paid") {
      updatePayload.paid_at = new Date().toISOString();
    }

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...updatePayload } as FinancialInvoice : inv
      )
    );

    const { error } = await supabase
      .from("financial_invoices")
      .update(updatePayload)
      .eq("id", invoiceId);

    if (error) {
      toast.error("Erro ao atualizar status.");
      fetchInvoices();
    } else {
      toast.success("Status atualizado!");
    }
  };

  const getColumnInvoices = (column: KanbanColumn) => {
    return invoices.filter(inv => getColumnForInvoice(inv) === column.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colInvoices = getColumnInvoices(col);
        return (
          <div
            key={col.id}
            className={cn(
              "rounded-lg border p-3 min-h-[200px]",
              col.borderColor,
              col.bgColor
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const invoiceId = e.dataTransfer.getData("text/invoice-id");
              if (!invoiceId) return;
              if (col.statusFilter[0] === "paid") {
                await handleStatusChange(invoiceId, "paid");
              } else if (col.id === "overdue") {
                await handleStatusChange(invoiceId, "overdue");
              } else {
                await handleStatusChange(invoiceId, "pending");
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn("text-sm font-semibold", col.color)}>{col.title}</h3>
              <span className={cn("text-xs font-medium", col.color)}>{colInvoices.length}</span>
            </div>

            <div className="space-y-2">
              {colInvoices.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma fatura</p>
              )}
              {colInvoices.map((inv) => (
                <Card
                  key={inv.id}
                  className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/invoice-id", inv.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight line-clamp-1">{inv.title || "Sem título"}</p>
                      <StatusBadge status={inv.status} className="shrink-0 text-[10px] px-1.5 py-0" />
                    </div>
                    {inv.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{inv.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.amount)}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(inv.due_date), "dd/MM")}
                      </div>
                    </div>
                    {col.id === "overdue" && (
                      <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Vencida
                      </div>
                    )}
                    {col.id !== "paid" && (
                      <div className="flex gap-1 pt-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          onClick={() => handleStatusChange(inv.id, "paid")}
                        >
                          Pagar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
