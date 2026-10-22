import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';

export function AppLayout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/panel" className="text-lg font-semibold text-brand">
            RentaCarDB
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/catalogo" className="text-sm text-slate-600 hover:text-brand">
              Catalogo
            </Link>
            {usuario?.roles.includes('CLIENTE') && (
              <>
                <Link to="/reservas" className="text-sm text-slate-600 hover:text-brand">
                  Mis reservas
                </Link>
                <Link to="/arriendos" className="text-sm text-slate-600 hover:text-brand">
                  Mis alquileres
                </Link>
              </>
            )}
            {(usuario?.roles.includes('PROVEEDOR') ||
              usuario?.roles.includes('OPERADOR') ||
              usuario?.roles.includes('ADMIN')) && (
              <>
                <Link to="/proveedor/reservas" className="text-sm text-slate-600 hover:text-brand">
                  Reservas
                </Link>
                <Link to="/proveedor/arriendos" className="text-sm text-slate-600 hover:text-brand">
                  Arriendos
                </Link>
                <Link to="/proveedor/vehiculos" className="text-sm text-slate-600 hover:text-brand">
                  Vehiculos
                </Link>
                <Link to="/proveedor/panel" className="text-sm text-slate-600 hover:text-brand">
                  Proveedor
                </Link>
              </>
            )}
            {usuario?.roles.includes('ADMIN') && (
              <>
                <Link to="/admin/proveedores" className="text-sm text-slate-600 hover:text-brand">
                  Admin
                </Link>
                <Link to="/admin/reportes" className="text-sm text-slate-600 hover:text-brand">
                  Reportes
                </Link>
                <Link to="/admin/catalogos" className="text-sm text-slate-600 hover:text-brand">
                  Catalogos
                </Link>
                <Link to="/admin/auditoria" className="text-sm text-slate-600 hover:text-brand">
                  Auditoria
                </Link>
              </>
            )}
            <Link to="/perfil" className="text-sm text-slate-600 hover:text-brand">
              Mi perfil
            </Link>
            <Link to="/chat" className="text-sm text-slate-600 hover:text-brand">
              Chat
            </Link>
            <span className="hidden text-sm text-slate-600 sm:inline">{usuario?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
