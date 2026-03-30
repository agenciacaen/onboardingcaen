import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Limpar qualquer lock/sessão travada ao montar a página de login
  useEffect(() => {
    try {
      // Limpar locks do GoTrue que podem ter ficado órfãos
      const lockKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('lock:sb-') || key.includes('-auth-token-code-verifier')
      );
      if (lockKeys.length > 0) {
        console.warn(`[Login] Removendo ${lockKeys.length} lock(s) travados:`, lockKeys);
        lockKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (e) {
      console.error('[Login] Falha ao limpar locks:', e);
    }
  }, []);

  // Se o usuário já está autenticado (veio aqui por engano), redirecionar
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      if (!state.isLoading && state.user && state.profile) {
        const role = state.profile.role;
        if (role === 'admin' || role === 'member') {
          navigate('/agency', { replace: true });
        } else if (role === 'client') {
          navigate('/client', { replace: true });
        }
      }
    });
    
    // Verificação instantânea
    const state = useAuthStore.getState();
    if (!state.isLoading && state.user && state.profile) {
      const role = state.profile.role;
      if (role === 'admin' || role === 'member') {
        navigate('/agency', { replace: true });
      } else if (role === 'client') {
        navigate('/client', { replace: true });
      }
    }
    
    return unsub;
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log('[Login] Iniciando login:', data.email);
    setLoading(true);
    
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('[Login] Erro Auth:', error.message);
        const errorMsg = error.message.includes('Invalid login credentials')
          ? 'Email ou senha incorretos.'
          : `Erro de autenticação: ${error.message}`;
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      console.log('[Login] Auth OK, buscando perfil...', authData.user?.id);

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('[Login] Erro ao buscar perfil:', profileError);
          toast.error('Erro ao carregar perfil de usuário.');
          setLoading(false);
          return;
        }

        if (profile) {
          // Pré-popular o store ANTES de navegar.
          // Isso garante que o ProtectedRoute não rejeite e
          // que o onAuthStateChange no App.tsx encontre o profile já setado.
          const store = useAuthStore.getState();
          store.setUser(authData.user);
          store.setProfile(profile);
          store.finishLoading();
          
          console.log('[Login] Perfil carregado. Role:', profile.role, '- Redirecionando...');
          
          if (profile.role === 'admin' || profile.role === 'member') {
            navigate('/agency', { replace: true });
          } else {
            navigate('/client', { replace: true });
          }
        } else {
          console.warn('[Login] Nenhum perfil encontrado para:', authData.user.id);
          toast.error('Nenhum perfil encontrado para este usuário.');
          await supabase.auth.signOut();
          useAuthStore.getState().clear();
        }
      }
    } catch (err) {
      console.error('[Login] Erro inesperado:', err);
      toast.error('Ocorreu um erro inesperado ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-muted-foreground">Insira as suas credenciais para acessar sua conta</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="seu@email.com" 
            {...register('email')} 
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            {...register('password')} 
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
