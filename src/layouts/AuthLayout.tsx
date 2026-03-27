
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex bg-muted flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Placeholder for optional background image / branding */}
        <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/50" />
        <div className="relative z-10 text-center text-slate-800 dark:text-slate-200">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Bem-vindo(a) à CAEN</h2>
          <p className="text-lg">Gestão e Infraestrutura de Marketing Premium.</p>
        </div>
      </div>
    </div>
  );
}
