import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ClientStats = {
  total: number;
  active: number;
  onboarding: number;
  inactive: number;
};

export function ClientSummaryGrid() {
  const [stats, setStats] = useState<ClientStats>({ total: 0, active: 0, onboarding: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientStats() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('status, deleted_at')
          .is('deleted_at', null);

        if (error) throw error;

        const active = data.filter(c => c.status === 'active').length;
        const onboarding = data.filter(c => c.status === 'onboarding').length;
        const inactive = data.filter(c => c.status === 'inactive').length;
        
        setStats({
          total: data.length,
          active,
          onboarding,
          inactive,
        });
      } catch (error) {
        console.error('Error fetching client stats:', error);
        toast.error('Erro ao carregar resumo de clientes');
      } finally {
        setLoading(false);
      }
    }

    fetchClientStats();
  }, []);

  if (loading) {
    return <LoadingSkeleton className="h-[120px] w-full" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Clientes na base</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          <Activity className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-xs text-muted-foreground">Contratos rodando</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Onboarding</CardTitle>
          <UserPlus className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.onboarding}</div>
          <p className="text-xs text-muted-foreground">Configuração inicial</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactive}</div>
          <p className="text-xs text-muted-foreground">Contratos pausados/encerrados</p>
        </CardContent>
      </Card>
    </div>
  );
}
