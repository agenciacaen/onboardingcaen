import { PartyPopper, LayoutDashboard, Share2, Globe, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CompletionScreenProps {
  clientName: string;
}

export function CompletionScreen({ clientName }: CompletionScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12 px-4">
      {/* CSS animado imitando confetti */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform transition-all -rotate-6 hover:rotate-0 relative z-10">
          <PartyPopper className="w-12 h-12 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
        Parabéns, {clientName}!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-xl">
        Você concluiu sua ativação com sucesso! Nossa equipe já foi notificada 
        e está pronta para acelerar os seus resultados. Comece a explorar seus módulos agora.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-muted hover:border-border transition-all hover:-translate-y-1"
          onClick={() => navigate('/client')}
        >
          <LayoutDashboard className="w-6 h-6 text-muted-foreground" />
          <span className="text-foreground">Dashboard Geral</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-muted hover:border-border transition-all hover:-translate-y-1"
          onClick={() => navigate('/client/traffic')}
        >
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          <span className="text-foreground">Tráfego Pago</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-muted hover:border-border transition-all hover:-translate-y-1"
          onClick={() => navigate('/client/social')}
        >
          <Share2 className="w-6 h-6 text-purple-500" />
          <span className="text-foreground">Social Media</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-muted hover:border-border transition-all hover:-translate-y-1"
          onClick={() => navigate('/client/web')}
        >
          <Globe className="w-6 h-6 text-blue-500" />
          <span className="text-foreground">Web & SEO</span>
        </Button>
      </div>

    </div>
  );
}
