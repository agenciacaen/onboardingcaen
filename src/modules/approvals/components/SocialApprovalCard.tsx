import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, LayoutTemplate } from 'lucide-react';
import type { SocialApproval } from '../types';

interface SocialApprovalCardProps {
  approval: SocialApproval;
  onApprove: (id: string, type: 'social_content' | 'web_delivery', status: 'approved' | 'rejected') => void;
  isLoading: boolean;
}

export function SocialApprovalCard({ approval, onApprove, isLoading }: SocialApprovalCardProps) {
  const content = approval.content;

  if (!content) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
            Social Media
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(approval.created_at).toLocaleDateString()}
          </span>
        </div>
        <CardTitle className="text-lg text-white">{content.title}</CardTitle>
        <CardDescription className="text-zinc-400">
          Plataformas: {content.platform?.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content.media_urls && content.media_urls.length > 0 && (
          <div className="mb-4 aspect-video bg-zinc-950 rounded-md overflow-hidden flex items-center justify-center border border-zinc-900">
            {content.media_type === 'image' || content.media_type === 'carousel' ? (
              <img src={content.media_urls[0]} alt="Post preview" className="object-cover w-full h-full" />
            ) : (
             <LayoutTemplate className="w-8 h-8 text-zinc-700" />
            )}
          </div>
        )}
        <div className="text-sm text-zinc-300 bg-black/20 p-3 rounded-md border border-white/5">
          <p className="whitespace-pre-wrap">{content.caption}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
          onClick={() => onApprove(approval.id, 'social_content', 'rejected')}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" /> Reprovar
        </Button>
        <Button 
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => onApprove(approval.id, 'social_content', 'approved')}
          disabled={isLoading}
        >
          <Check className="w-4 h-4 mr-2" /> Aprovar
        </Button>
      </CardFooter>
    </Card>
  );
}
