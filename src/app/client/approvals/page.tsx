import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { NotificationService } from "@/services/notification.service";
import { AutomationService } from "@/services/automation.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Grid, List, CheckCircle, XCircle, Clock, FileVideo, Expand, ExternalLink, Shield } from "lucide-react";

interface Creative {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  status: "pending" | "approved" | "rejected";
  feedback: string | null;
}

export function ClientApprovalsPage() {
  const { clientId, profile, role } = useAuth();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  // Armazena a sugestão digitada para cada card
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const canManage = role === 'admin' || profile?.role === 'admin' || profile?.permissions?.approvals === 'manage' || !profile?.permissions?.approvals;

  useEffect(() => {
    if (clientId) fetchCreatives();
    
    // Marcar notificações como lidas ao entrar na página
    if (clientId) {
      NotificationService.markAsReadByType(clientId, 'approval');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchCreatives = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_approvals")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar os criativos pendentes");
      console.error(error);
    } else {
      setCreatives(data as Creative[]);
      // Popula o estado inicial de feedbacks com o que já tem no banco
      const initialFeedbacks: Record<string, string> = {};
      data?.forEach(c => {
        initialFeedbacks[c.id] = c.feedback || "";
      });
      setFeedbacks(initialFeedbacks);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, newStatus: "approved" | "rejected") => {
    setProcessingId(id);
    const feedbackText = feedbacks[id] || (newStatus === 'rejected' ? "Sem sugestão detalhada" : null);
    
    try {
      const { data, error } = await supabase
        .from("post_approvals")
        .update({ status: newStatus, feedback: feedbackText })
        .eq("id", id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error("Não foi possível atualizar. Verifique suas permissões.");
        return;
      }
      
      if (newStatus === "approved" ? "Arte aprovada com sucesso!" : "Alterações solicitadas com sucesso.") {
        toast.success(newStatus === "approved" ? "Arte aprovada com sucesso!" : "Alterações solicitadas com sucesso.");
      }
      
      // Se for reprovado, cria tarefa automática para a equipe
      if (newStatus === 'rejected' && clientId && profile?.id) {
        await AutomationService.createTaskFromRejection(clientId, profile.id, {
          title: creatives.find(c => c.id === id)?.title || 'Arte sem título',
          feedback: feedbackText || 'Sem feedback detalhado'
        });
      }

      setCreatives(prev => prev.map(c => 
        c.id === id ? { ...c, status: newStatus, feedback: feedbackText } : c
      ));

      // Se o modal estiver aberto com este criativo, sincroniza
      if (selectedCreative?.id === id) {
        setSelectedCreative({ ...selectedCreative, status: newStatus, feedback: feedbackText });
      }
    } catch (err) {
      console.error(err);
      toast.error("Houve um erro ao processar sua ação.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = creatives.filter(c => c.status === "pending").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <PageHeader 
          title="Central de Aprovações" 
          description={pendingCount > 0 
            ? `Você tem ${pendingCount} criativo(s) aguardando sua revisão.` 
            : "Acompanhe as entregas que precisam da sua autorização."} 
        />
        <div className="flex bg-muted p-1 rounded-md shrink-0">
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
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : creatives.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
          <h4 className="text-xl font-medium text-slate-700">Tudo Atualizado!</h4>
          <p className="text-slate-500 mt-2">Você não possui criativos ou posts aguardando aprovação no momento.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatives.map(creative => (
                <div key={creative.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
                  {/* Arquivo / Mídia */}
                  <div className="aspect-[4/3] bg-slate-100 relative group overflow-hidden cursor-pointer" onClick={() => setSelectedCreative(creative)}>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <Expand className="w-8 h-8 text-white drop-shadow" />
                    </div>
                    {creative.file_type === 'image' ? (
                      <img src={creative.file_url} alt={creative.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={creative.file_url} className="w-full h-full object-cover" />
                    )}
                    {creative.status === 'pending' && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-lg z-20">
                        Aguardando
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{creative.title}</h3>
                    {creative.description && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border italic line-clamp-3">
                        "{creative.description}"
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t space-y-4">
                      {creative.status === 'approved' && (
                        <div className="bg-emerald-50 text-emerald-700 p-3 flex items-center justify-center gap-2 rounded-lg font-medium text-sm border border-emerald-100">
                          <CheckCircle className="w-5 h-5" />
                          Arte Aprovada
                        </div>
                      )}

                      {creative.status === 'rejected' && (
                        <div className="space-y-3">
                          <div className="bg-amber-50 text-amber-700 p-3 flex items-center justify-center gap-2 rounded-lg font-medium text-sm border border-amber-100/50">
                            <Clock className="w-5 h-5" />
                            Aguardando Ajustes da Agência
                          </div>
                          <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border italic">
                            Sua sugestão: "{creative.feedback}"
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-slate-400 hover:text-slate-600 text-[10px] uppercase font-bold"
                            onClick={() => setCreatives(prev => prev.map(c => c.id === creative.id ? { ...c, status: 'pending' } : c))}
                          >
                            Editar Sugestão
                          </Button>
                        </div>
                      )}

                      {creative.status === 'pending' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Tenho uma sugestão / Correção
                            </label>
                            <Textarea 
                              placeholder={canManage ? "Gostaria de mudar a cor, o texto da imagem..." : "Você não tem permissão para enviar sugestões"}
                              className="text-sm resize-none h-20"
                              value={feedbacks[creative.id] || ""}
                              onChange={e => setFeedbacks({ ...feedbacks, [creative.id]: e.target.value })}
                              disabled={!canManage}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                              onClick={() => handleAction(creative.id, "rejected")}
                              disabled={processingId === creative.id || !canManage}
                            >
                              {processingId === creative.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                              Reprovar
                            </Button>
                            <Button 
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                              onClick={() => handleAction(creative.id, "approved")}
                              disabled={processingId === creative.id || !canManage}
                            >
                              {processingId === creative.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                              Aprovar
                            </Button>
                          </div>
                          {!canManage && (
                            <p className="text-[10px] text-center text-slate-400 mt-2 italic">
                              Seu acesso é apenas para visualização.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 border-b text-slate-500 font-medium whitespace-nowrap">
                     <tr>
                       <th className="px-6 py-4">Prévia</th>
                       <th className="px-6 py-4">Detalhes</th>
                       <th className="px-6 py-4 w-64">Sua Sugestão</th>
                       <th className="px-6 py-4 text-center">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {creatives.map(creative => (
                       <tr key={creative.id} className="hover:bg-slate-50/50">
                         <td className="px-6 py-4 w-32 text-center">
                           <div 
                             className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-sm cursor-pointer group mx-auto"
                             onClick={() => setSelectedCreative(creative)}
                           >
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                               <Expand className="w-6 h-6 text-white drop-shadow" />
                             </div>
                             {creative.file_type === 'image' ? (
                               <img src={creative.file_url} alt={creative.title} className="w-full h-full object-cover" />
                             ) : (
                               <div className="bg-slate-200 w-full h-full flex items-center justify-center">
                                 <FileVideo className="w-8 h-8 text-slate-400" />
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-slate-800 text-base">{creative.title}</h4>
                             {creative.status === 'pending' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Aguardando</span>}
                             {creative.status === 'approved' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Aprovado</span>}
                             {creative.status === 'rejected' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ajustes</span>}
                           </div>
                           <p className="text-sm text-slate-500 line-clamp-2 max-w-sm">{creative.description || "Sem descrição"}</p>
                         </td>
                         <td className="px-6 py-4">
                           {creative.status === 'pending' ? (
                             <Textarea 
                               placeholder={canManage ? "Digite sua sugestão..." : "Apenas visualização"}
                               className="text-sm resize-none h-20"
                               value={feedbacks[creative.id] || ""}
                               onChange={e => setFeedbacks({ ...feedbacks, [creative.id]: e.target.value })}
                               disabled={!canManage}
                             />
                           ) : (
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-600 italic">"{creative.feedback || "Sem comentário adicionado."}"</p>
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4">
                           {creative.status === 'pending' ? (
                             canManage ? (
                               <div className="flex flex-col gap-2 max-w-[140px] mx-auto">
                                 <Button 
                                   size="sm"
                                   className="bg-emerald-600 hover:bg-emerald-700"
                                   onClick={() => handleAction(creative.id, "approved")}
                                   disabled={processingId === creative.id}
                                 >
                                   <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprovar
                                 </Button>
                                 <Button 
                                   size="sm"
                                   variant="outline"
                                   className="text-red-600 hover:bg-red-50 border-red-200"
                                   onClick={() => handleAction(creative.id, "rejected")}
                                   disabled={processingId === creative.id}
                                 >
                                   <XCircle className="w-3.5 h-3.5 mr-1" /> Reprovar
                                 </Button>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center text-slate-400 group" title="Você não tem permissão para realizar ações">
                                 <Shield className="w-6 h-6 mb-1 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                 <span className="text-[10px] font-bold uppercase tracking-tight">Visualização</span>
                               </div>
                             )
                           ) : creative.status === 'approved' ? (
                             <div className="flex flex-col items-center gap-1 text-emerald-600">
                               <CheckCircle className="w-8 h-8" />
                               <span className="text-[10px] font-bold uppercase tracking-tight">Aprovado</span>
                             </div>
                           ) : (
                             <div className="flex flex-col items-center gap-1 text-amber-500" title="Aguardando Ajustes">
                               <Clock className="w-8 h-8" />
                               <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-none">Aguardando<br/>Ajuste</span>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </>
      )}

      {/* Modal Expansion / Visualização */}
      <Dialog open={!!selectedCreative} onOpenChange={(open) => !open && setSelectedCreative(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 gap-0">
          <DialogTitle className="sr-only">Visualização do Criativo</DialogTitle>
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            {/* Esquerda: Mídia View */}
            <div className="flex-1 bg-[#0f172a] flex items-center justify-center relative p-4 md:p-8 min-h-[400px]">
              {selectedCreative?.file_type === 'image' ? (
                <img 
                  src={selectedCreative.file_url} 
                  alt={selectedCreative.title} 
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                />
              ) : (
                <video 
                  src={selectedCreative?.file_url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[80vh] w-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                />
              )}
              
              {/* Botão flutuante para abrir original */}
              <a 
                href={selectedCreative?.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-full transition-all shadow-xl"
                title="Ver arquivo original"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
            
            {/* Direita: Interações e Infos */}
            <div className="w-full md:w-[380px] bg-white flex flex-col border-l">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-xl text-slate-800">{selectedCreative?.title}</h3>
                </div>
                {selectedCreative?.description ? (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border italic">
                    "{selectedCreative.description}"
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sem legenda ou descrição.</p>
                )}
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {selectedCreative?.status === 'approved' ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 text-center">
                    <CheckCircle className="w-8 h-8 mb-1" />
                    <div>
                      <span className="font-bold block text-lg">Arte Aprovada</span>
                      <span className="text-sm opacity-90 block mt-1">Este material está pronto para ser publicado!</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCreative?.status === 'rejected' && (
                      <div className="bg-amber-50 text-amber-700 p-4 flex flex-col gap-1 rounded-xl border border-amber-100 text-sm mb-4 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="font-bold block">Aguardando Agência</span>
                        <span className="opacity-80 italic">"{selectedCreative.feedback}"</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-xs h-7 border-amber-200 bg-white"
                          onClick={() => {
                            if (selectedCreative) {
                              setCreatives(prev => prev.map(c => c.id === selectedCreative.id ? { ...c, status: 'pending' } : c));
                              setSelectedCreative({ ...selectedCreative, status: 'pending' });
                            }
                          }}
                        >
                          Alterar Comentário
                        </Button>
                      </div>
                    )}

                    {selectedCreative?.status === 'pending' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Sua Sugestão / Correção
                          </label>
                          <Textarea 
                            placeholder={canManage ? "Ex: Mudar a cor do fundo, alterar o texto da chamada..." : "Você não tem permissão para enviar sugestões"}
                            className="text-sm resize-none h-24"
                            value={selectedCreative ? feedbacks[selectedCreative.id] || "" : ""}
                            onChange={e => {
                              if (selectedCreative) {
                                setFeedbacks({ ...feedbacks, [selectedCreative.id]: e.target.value });
                              }
                            }}
                            disabled={!canManage}
                          />
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t">
                          <Button 
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => {
                              if (selectedCreative) {
                                handleAction(selectedCreative.id, "approved");
                              }
                            }}
                            disabled={processingId === selectedCreative?.id || !canManage}
                          >
                            {processingId === selectedCreative?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                            Sim, Aprovar
                          </Button>
                          <Button 
                            size="lg"
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              if (selectedCreative) {
                                handleAction(selectedCreative.id, "rejected");
                              }
                            }}
                            disabled={processingId === selectedCreative?.id || !canManage}
                          >
                            {processingId === selectedCreative?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                            Recusar e Sugerir
                          </Button>
                          {!canManage && (
                            <p className="text-xs text-center text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-dashed">
                              Apenas usuários com permissão de gerenciamento podem aprovar ou solicitar ajustes.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
