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

  // Previne "Lock was not released" do Supabase gotrue travando o login de maneira resiliente
  useEffect(() => {
    try {
      const lockKeys = Object.keys(localStorage).filter(key => key.startsWith('lock:sb-'));
      if (lockKeys.length > 0) {
        console.warn(`Removendo ${lockKeys.length} lock(s) de auth travados:`, lockKeys);
        lockKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (e) {
      console.error('Falha ao limpar locks de autenticação:', e);
    }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log('Iniciando submissão de login:', data.email);
    setLoading(true);
    
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('Erro Supabase Auth:', error.message);
        const errorMsg = error.message.includes('Invalid login credentials')
          ? 'Email ou senha incorretos.'
          : `Erro de autenticação: ${error.message}`;
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      console.log('Login Auth bem-sucedido, buscando perfil...', authData.user?.id);

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          toast.error('Erro ao carregar perfil de usuário.');
          setLoading(false);
          return;
        }

        if (profile) {
          // Pre-populate store so ProtectedRoute doesn't reject us prematurely while onAuthStateChange is still fetching
          useAuthStore.getState().setProfile(profile);
          console.log('Perfil encontrado, redirecionando para:', profile.role);
          
          if (profile.role === 'admin' || profile.role === 'member') {
            navigate('/agency');
          } else {
            navigate('/client');
          }
        } else {
          console.warn('Perfil não encontrado para o usuário logado.');
          toast.error('Nenhum perfil encontrado para este usuário.');
        }
      }
    } catch (err) {
      console.error('Erro inesperado no login:', err);
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
            {/* Opcional: <a href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</a> */}
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
