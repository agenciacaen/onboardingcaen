import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Edit3, Paperclip } from 'lucide-react';
import type { WebDeliveryApproval } from '../types';

interface WebApprovalCardProps {
  approval: WebDeliveryApproval;
  onApprove: (id: string, type: 'social_content' | 'web_delivery', status: 'approved' | 'rejected') => void;
  isLoading: boolean;
}

export function WebApprovalCard({ approval, onApprove, isLoading }: WebApprovalCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
            Web & SEO
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(approval.created_at).toLocaleDateString()}
          </span>
        </div>
        <CardTitle className="text-lg text-white">{approval.title}</CardTitle>
        <CardDescription className="text-zinc-400">
          Tipo: {approval.delivery_type || 'Geral'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-zinc-300 bg-black/20 p-3 rounded-md border border-white/5">
          <p className="whitespace-pre-wrap">{approval.description}</p>
        </div>
        
        {approval.file_urls && approval.file_urls.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wider uppercase">
              Anexos
            </span>
            <div className="space-y-2">
              {approval.file_urls.map((url, i) => (
                <a 
                  key={i} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/5 p-2 rounded border border-blue-500/10"
                >
                  <Paperclip className="w-4 h-4" />
                  Visualizar anexo {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400"
          onClick={() => onApprove(approval.id, 'web_delivery', 'rejected')}
          disabled={isLoading}
        >
          <Edit3 className="w-4 h-4 mr-2" /> Solicitar Revisão
        </Button>
        <Button 
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => onApprove(approval.id, 'web_delivery', 'approved')}
          disabled={isLoading}
        >
          <Check className="w-4 h-4 mr-2" /> Aprovar Entrega
        </Button>
      </CardFooter>
    </Card>
  );
}
