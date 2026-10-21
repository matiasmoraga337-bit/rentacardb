import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RequireRoleProps {
  roles: string[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.some((rol) => usuario.roles.includes(rol))) {
    return <Navigate to="/panel" replace />;
  }
  return <>{children}</>;
}
