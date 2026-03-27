import { useEffect, useState, useRef } from 'react';
import { SupportService } from '../services/support.service';
import type { SupportTicket, SupportMessage } from '../types';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, User, Shield, Info, ArrowLeft, Paperclip, Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketChatViewProps {
  ticketId: string;
}

export function TicketChatView({ ticketId }: TicketChatViewProps) {
  const { clientId, profile } = useAuthStore();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientId && ticketId) {
      loadData();
      
      const subscription = supabase
        .channel(`ticket_${ticketId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages',
            filter: `ticket_id=eq.${ticketId}`
        }, () => {
            // Need to fetch full message with profile to display nicely
            // For now, reload messages or append basic
            loadData(false); // pass false to avoid loading spinner overlay
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [clientId, ticketId]);

  const loadData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [tData, mData] = await Promise.all([
        SupportService.getTicket(ticketId),
        SupportService.getMessages(ticketId)
      ]);
      setTicket(tData);
      setMessages(mData as unknown as SupportMessage[]);
      await SupportService.markMessagesAsRead(ticketId);
    } catch {
      toast.error('Erro ao carregar detalhes do chamado.');
    } finally {
      if (showLoader) setIsLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !clientId || !ticketId) return;

    setIsSending(true);
    try {
      // Optimistic append
      const content = newMessage;
      setNewMessage('');
      
      await SupportService.sendMessage(clientId, ticketId, content);
      scrollToBottom();
    } catch {
       toast.error('Falha ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Análise';
      case 'resolved': return 'Resolvido';
      default: return 'Fechado';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-zinc-800" onClick={() => navigate('/client/support')}>
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {ticket.subject}
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
              <span>#{ticket.id.split('-')[0]}</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${ticket.status === 'resolved' ? 'bg-purple-500' : ticket.status === 'open' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                {getStatusText(ticket.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-950/50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === profile?.id; // Usando profile do authStore
          const role = msg.sender_profile?.role;
          const isAgency = role === 'admin' || role === 'gestor' || role === 'membro';
          const avatar = msg.sender_profile?.avatar_url;

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center border border-zinc-700 overflow-hidden">
                {avatar ? (
                   <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : isAgency ? (
                  <Shield className="w-4 h-4 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-medium text-zinc-400">
                    {msg.sender_profile?.full_name || 'Usuário'}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {format(new Date(msg.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : isAgency 
                      ? 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700' 
                      : 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800'
                }`}>
                  {msg.message}
                </div>
                {msg.attachment_url && (
                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-2 text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                    <Paperclip className="w-3 h-3" /> Anexo
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
        <div className="relative">
          <Textarea 
            placeholder="Digite sua mensagem de resposta..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full pr-14 resize-none bg-zinc-950 border-zinc-800 text-white min-h-[60px] max-h-[150px]"
          />
          <Button 
            size="icon" 
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || ticket.status === 'resolved' || ticket.status === 'closed'}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-0.5" />}
          </Button>
        </div>
        {(ticket.status === 'resolved' || ticket.status === 'closed') && (
           <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500 bg-zinc-950/50 p-2 rounded-md border border-zinc-800/50">
             <Info className="w-4 h-4 text-purple-400" />
             Este chamado foi encerrado e não aceita novas mensagens.
           </div>
        )}
      </div>
    </div>
  );
}
