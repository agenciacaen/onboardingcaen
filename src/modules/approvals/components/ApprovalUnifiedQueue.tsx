import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialApprovalCard } from './SocialApprovalCard';
import { WebApprovalCard } from './WebApprovalCard';
import { ApprovalsService } from '../services/approvals.service';
import type { SocialApproval, WebDeliveryApproval } from '../types';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThumbsUp, Loader2 } from 'lucide-react';

export function ApprovalUnifiedQueue() {
  const { clientId } = useAuthStore();
  const [socialItems, setSocialItems] = useState<SocialApproval[]>([]);
  const [webItems, setWebItems] = useState<WebDeliveryApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadApprovals();
    }
  }, [clientId]);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      if (!clientId) return;
      const data = await ApprovalsService.getPendingApprovals(clientId);
      setSocialItems(data.social || []);
      setWebItems(data.web || []);
    } catch (error) {
      console.error('Failed to load approvals:', error);
      toast.error('Erro ao carregar fila de aprovações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'social_content' | 'web_delivery', status: 'approved' | 'rejected') => {
    setIsApproving(id);
    try {
      await ApprovalsService.approveItem(id, type, status);
      toast.success(status === 'approved' ? 'Item aprovado!' : 'Revisão/Reprovação solicitada com sucesso!');
      
      // Update local state to remove the processed item
      if (type === 'social_content') {
        setSocialItems(prev => prev.filter(item => item.id !== id));
      } else {
        setWebItems(prev => prev.filter(item => item.id !== id));
      }
    } catch {
      toast.error('Ocorreu um erro ao processar sua resposta.');
    } finally {
      setIsApproving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Buscando itens pendentes...</p>
      </div>
    );
  }

  const totalItems = socialItems.length + webItems.length;

  if (totalItems === 0) {
    return (
      <EmptyState 
        icon={ThumbsUp} 
        title="Tudo em dia!" 
        description="Você não tem nenhum item pendente de aprovação no momento." 
      />
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 bg-zinc-900 border border-white/10">
        <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">
          Todos <span className="ml-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-xs">{totalItems}</span>
        </TabsTrigger>
        <TabsTrigger value="social" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
          Social <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{socialItems.length}</span>
        </TabsTrigger>
        <TabsTrigger value="web" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
          Web <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{webItems.length}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialItems.map(item => (
            <SocialApprovalCard 
              key={item.id} 
              approval={item} 
              onApprove={handleApprove} 
              isLoading={isApproving === item.id} 
            />
          ))}
          {webItems.map(item => (
            <WebApprovalCard 
              key={item.id} 
              approval={item} 
              onApprove={handleApprove} 
              isLoading={isApproving === item.id} 
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="social">
        {socialItems.length === 0 ? (
          <EmptyState icon={ThumbsUp} title="Limpo" description="Sem aprovações de social pendentes." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialItems.map(item => (
              <SocialApprovalCard 
                key={item.id} 
                approval={item} 
                onApprove={handleApprove} 
                isLoading={isApproving === item.id} 
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="web">
        {webItems.length === 0 ? (
           <EmptyState icon={ThumbsUp} title="Limpo" description="Sem aprovações web pendentes." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webItems.map(item => (
              <WebApprovalCard 
                key={item.id} 
                approval={item} 
                onApprove={handleApprove} 
                isLoading={isApproving === item.id} 
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
