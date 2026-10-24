import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  FileText,
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ReceiptText,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { NotificationBell } from '@/features/notificaciones/NotificationBell';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function crearGrupos(roles: string[]): NavGroup[] {
  const esCliente = roles.includes('CLIENTE');
  const esProveedor = roles.includes('PROVEEDOR') || roles.includes('OPERADOR');
  const esAdmin = roles.includes('ADMIN');

  const grupos: NavGroup[] = [
    {
      label: 'General',
      items: [
        { to: '/panel', label: 'Panel', icon: LayoutDashboard, end: true },
        { to: '/catalogo', label: 'Catálogo', icon: Car },
      ],
    },
  ];

  if (esCliente) {
    grupos.push({
      label: 'Mi actividad',
      items: [
        { to: '/reservas', label: 'Mis reservas', icon: CalendarDays },
        { to: '/arriendos', label: 'Mis alquileres', icon: KeyRound },
        { to: '/favoritos', label: 'Favoritos', icon: Heart },
        { to: '/busquedas', label: 'Búsquedas guardadas', icon: Search },
      ],
    });
  }

  if (esProveedor) {
    grupos.push({
      label: 'Operación',
      items: [
        { to: '/proveedor/reservas', label: 'Reservas', icon: Ticket },
        { to: '/proveedor/arriendos', label: 'Arriendos', icon: ClipboardList },
        { to: '/proveedor/vehiculos', label: 'Vehículos', icon: Car },
        { to: '/proveedor/panel', label: 'Configuración y sedes', icon: Building2 },
        { to: '/proveedor/liquidaciones', label: 'Liquidaciones', icon: Wallet },
      ],
    });
  }

  if (esAdmin) {
    grupos.push({
      label: 'Administración',
      items: [
        { to: '/admin/proveedores', label: 'Proveedores', icon: Users },
        { to: '/admin/reportes', label: 'Reportes', icon: FileText },
        { to: '/admin/catalogos', label: 'Catálogos', icon: ReceiptText },
        { to: '/admin/auditoria', label: 'Auditoría', icon: ShieldCheck },
        { to: '/admin/disputas', label: 'Disputas', icon: MessageSquare },
        { to: '/admin/liquidaciones', label: 'Liquidaciones', icon: Wallet },
        { to: '/admin/outbox', label: 'Outbox', icon: MessageSquare },
      ],
    });
  }

  if (esCliente || esProveedor || esAdmin) {
    grupos.push({
      label: 'Cuenta',
      items: [
        { to: '/chat', label: 'Chat', icon: MessageSquare },
        { to: '/notificaciones', label: 'Notificaciones', icon: Bell },
        { to: '/perfil', label: 'Mi perfil', icon: UserRound },
        ...(esCliente || esProveedor
          ? [{ to: '/disputas', label: 'Disputas', icon: ShieldCheck }]
          : []),
      ],
    });
  }

  return grupos;
}

function SidebarContent({
  email,
  roles,
  grupos,
  onNavigate,
  onLogout,
}: {
  email: string;
  roles: string[];
  grupos: NavGroup[];
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const rol =
    (roles.includes('ADMIN') && 'Administrador') ||
    (roles.includes('PROVEEDOR') && 'Proveedor') ||
    (roles.includes('OPERADOR') && 'Operador') ||
    (roles.includes('CLIENTE') && 'Cliente') ||
    'Usuario';

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
        <Link to="/panel" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <Car className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-lg font-semibold tracking-tight text-slate-900">
            RentaCarDB
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          {onNavigate && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar menu"
              autoFocus
              onClick={onNavigate}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-3 py-5"
        aria-label="Navegacion principal"
      >
        {grupos.map((grupo) => (
          <div key={grupo.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {grupo.label}
            </p>
            <ul className="space-y-0.5">
              {grupo.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <p className="truncate text-sm font-medium text-slate-900" title={email}>
          {email}
        </p>
        <p className="mb-3 text-xs text-slate-500">{rol}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Salir
        </Button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const grupos = crearGrupos(usuario?.roles ?? []);
  const email = usuario?.email ?? '';
  const roles = usuario?.roles ?? [];

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAbierto) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const root = menuRef.current;
    const focusables = root
      ? Array.from(
          root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.offsetParent !== null)
      : [];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const closeButton = root?.querySelector<HTMLElement>('button[aria-label="Cerrar menu"]');
    (closeButton ?? first)?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMenuAbierto(false);
        return;
      }
      if (event.key !== 'Tab' || !first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [menuAbierto]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>

      <aside className="sticky top-0 hidden h-[100dvh] border-r border-slate-200 lg:block">
        <SidebarContent
          email={email}
          roles={roles}
          grupos={grupos}
          onLogout={logout}
        />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <Link to="/panel" className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white">
              <Car className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate text-base font-semibold tracking-tight">RentaCarDB</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Abrir menu"
              aria-expanded={menuAbierto}
              aria-controls="menu-lateral"
              onClick={() => setMenuAbierto(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main
          id="contenido"
          className="mx-auto max-w-7xl px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8"
        >
          <Suspense
            fallback={
              <div
                className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
                role="status"
                aria-live="polite"
              >
                Cargando…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
          />
          <aside
            ref={menuRef}
            id="menu-lateral"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacion"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl"
          >
            <SidebarContent
              email={email}
              roles={roles}
              grupos={grupos}
              onNavigate={() => setMenuAbierto(false)}
              onLogout={logout}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
