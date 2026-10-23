import { Car, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';

export function PublicHeader() {
  const { usuario, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/catalogo" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm sm:h-9 sm:w-9">
            <Car className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            RentaCarDB
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación principal">
          <Link
            to="/catalogo"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            Catalogo
          </Link>
          {usuario && (
            <Link
              to={usuario.roles.includes('CLIENTE') ? '/reservas' : '/panel'}
              className="rounded-full px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              {usuario.roles.includes('CLIENTE') ? 'Mis reservas' : 'Mi panel'}
            </Link>
          )}
          {usuario ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          ) : (
            <Link to="/login" className={buttonVariants({ size: 'sm' })}>
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
