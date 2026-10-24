import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-slate-500">Cargando…</div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
