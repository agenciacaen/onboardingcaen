import { useEffect, useState } from 'react';
import { SupportService } from '../services/support.service';
import type { SupportTicket } from '../types';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageCircle, Search, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketCreateModal } from './TicketCreateModal';

export function SupportTicketList() {
  const { clientId } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadTickets();
    }
  }, [clientId]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      if (!clientId) return;
      const data = await SupportService.getTickets(clientId);
      setTickets(data);
    } catch {
      toast.error('Erro ao carregar seus tickets de suporte.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aberto</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Em Análise</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Resolvido</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Fechado</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar chamados..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/50"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Chamado
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState 
          icon={MessageCircle} 
          title="Nenhum chamado aberto" 
          description="Você ainda não precisou acionar nosso suporte. Clique em Novo Chamado se precisar de ajuda." 
        />
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
          Nenhum chamado encontrado para a busca atual.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => navigate(`/client/support/${ticket.id}`)}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-800/80 cursor-pointer transition-all duration-200 gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono text-zinc-500">#{ticket.id.split('-')[0]}</span>
                  {getStatusBadge(ticket.status)}
                  {ticket.priority === 'high' && (
                    <span className="text-xs text-red-400 font-medium">Urgente</span>
                  )}
                </div>
                <h3 className="text-base font-medium text-zinc-100">{ticket.subject}</h3>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-zinc-500 whitespace-nowrap">
                <Clock className="w-4 h-4" />
                Atualizado há {formatDistanceToNow(new Date(ticket.updated_at), { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TicketCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadTickets} 
      />
    </div>
  );
}
