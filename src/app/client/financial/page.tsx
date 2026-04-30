import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  StickyNote,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { type FinancialInvoice } from "@/types/general.types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ClientFinancialPage() {
  const { clientId } = useAuth();
  const [invoices, setInvoices] = useState<FinancialInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<FinancialInvoice | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [tempText, setTempText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('financial_invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error("Erro ao buscar faturas:", error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await fetchInvoices();
    })();
    return () => { mounted = false; };
  }, [fetchInvoices]);

  const handleUpdateInvoice = async (invoiceId: string, updates: Partial<FinancialInvoice>) => {
    setSubmitting(true);
    const { error } = await supabase
      .from('financial_invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (error) {
      toast.error("Erro ao atualizar fatura.");
    } else {
      toast.success("Fatura atualizada com sucesso!");
      fetchInvoices();
      setIsDisputeOpen(false);
      setIsNotesOpen(false);
    }
    setSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'overdue': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'disputed': return <MessageSquare className="h-5 w-5 text-orange-500" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financeiro" 
        description="Acompanhe suas faturas, boletos e histórico de pagamentos." 
      />

      {loading ? (
        <LoadingSkeleton className="h-[300px] w-full" />
      ) : invoices.length > 0 ? (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className={`overflow-hidden hover:border-primary/30 transition-colors ${invoice.status === 'disputed' ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getStatusIcon(invoice.status)}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <h3 className="font-bold text-lg text-foreground">{invoice.title || "Fatura CAEN"}</h3>
                      {invoice.client_notes && <StickyNote className="h-4 w-4 text-primary opacity-50" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.description || "Pagamento referente a serviços de agência."}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                       <span className="bg-muted px-2 py-1 rounded border border-border/50">
                         Vence em: {format(new Date(invoice.due_date), "dd/MM/yyyy")}
                       </span>
                       <span className="bg-muted px-2 py-1 rounded border border-border/50">
                         Categoria: {invoice.category === 'ads' ? 'Tráfego Pago' : 'Mão de Obra'}
                       </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-2">
                    <div className="text-2xl font-black text-foreground">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-2 justify-center">
                    {invoice.status !== 'paid' && (
                      <Button 
                        variant="default" 
                        className="shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" 
                        onClick={() => handleUpdateInvoice(invoice.id, { status: 'paid', paid_at: new Date().toISOString() })}
                        disabled={submitting}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Já fiz o pagamento
                      </Button>
                    )}

                    {invoice.status === 'paid' && (
                      <Button 
                        variant="outline" 
                        className="border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => {
                          if (window.confirm("Deseja marcar esta fatura como pendente novamente?")) {
                            handleUpdateInvoice(invoice.id, { status: 'pending', paid_at: null });
                          }
                        }}
                        disabled={submitting}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reverter Pagamento
                      </Button>
                    )}

                    {invoice.file_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={invoice.file_url} target="_blank" rel="noreferrer">
                          <FileText className="mr-2 h-4 w-4" /> Visualizar
                        </a>
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setTempText(invoice.dispute_message || "");
                        setIsDisputeOpen(true);
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Questionar
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setTempText(invoice.client_notes || "");
                        setIsNotesOpen(true);
                      }}
                    >
                      <StickyNote className="mr-2 h-4 w-4" /> Notas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-xl font-bold">Nenhuma fatura encontrada</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Você ainda não possui faturas ou boletos pendentes. Quando a agência enviar, eles aparecerão aqui.
          </p>
        </div>
      )}

      {/* Modal de Questionamento */}
      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Questionar Fatura</DialogTitle>
            <DialogDescription>
              Descreva o motivo do seu questionamento ou dúvida sobre esta fatura. Nossa equipe entrará em contato.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Digite aqui sua mensagem..."
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisputeOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={submitting || !tempText.trim()}
              onClick={() => handleUpdateInvoice(selectedInvoice!.id, { 
                dispute_message: tempText, 
                status: 'disputed',
                dispute_at: new Date().toISOString()
              })}
            >
              Enviar Questionamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Notas */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas do Cliente</DialogTitle>
            <DialogDescription>
              Adicione observações internas ou informações extras sobre esta fatura.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Ex: Já agendei para o dia 05..."
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesOpen(false)}>Cancelar</Button>
            <Button 
              disabled={submitting}
              onClick={() => handleUpdateInvoice(selectedInvoice!.id, { client_notes: tempText })}
            >
              Salvar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
