import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from './ui/skeleton';
import type { Role } from '../types/auth.types';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 'member' pode acessar rotas de 'admin' (painel da agência)
  // Se for admin/member e estiver com impersonatedClientId, pode acessar rotas de 'client'
  const isAgencyRole = role === 'admin' || role === 'member';
  const isImpersonating = isAgencyRole && !!useAuthStore.getState().impersonatedClientId;
  
  const hasAccess = 
    !requiredRole || 
    role === requiredRole || 
    (requiredRole === 'admin' && role === 'member') ||
    (requiredRole === 'client' && isImpersonating);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
