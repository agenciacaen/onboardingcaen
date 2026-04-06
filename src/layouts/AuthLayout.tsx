
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex bg-card flex-col justify-center items-center p-12 relative overflow-hidden border-l border-border">
        {/* Painel lateral com branding premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 text-center text-foreground">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-primary">Bem-vindo(a) à CAEN</h2>
          <p className="text-lg text-muted-foreground">Gestão e Infraestrutura de Marketing Premium.</p>
        </div>
      </div>
    </div>
  );
}
