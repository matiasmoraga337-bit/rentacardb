import { ArrowRight, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';
import { PanelAdmin } from '@/features/paneles/PanelAdmin';
import { PanelCliente } from '@/features/paneles/PanelCliente';
import { PanelProveedor } from '@/features/paneles/PanelProveedor';

export function DashboardPage() {
  const { usuario } = useAuth();
  const roles = usuario?.roles ?? [];
  const esAdmin = roles.includes('ADMIN');
  const esProveedor = roles.includes('PROVEEDOR') || roles.includes('OPERADOR');
  const esCliente = roles.includes('CLIENTE');
  const sinPanel = !esAdmin && !esProveedor && !esCliente;

  const rol = esAdmin
    ? 'Administrador'
    : esProveedor
      ? roles.includes('OPERADOR')
        ? 'Operador'
        : 'Proveedor'
      : esCliente
        ? 'Cliente'
        : 'Usuario';

  const descripcion = esAdmin
    ? 'Controla proveedores, reservas y comisiones de la plataforma.'
    : esProveedor
      ? 'Gestiona tu flota, reservas y liquidaciones.'
      : 'Revisa tus reservas, alquileres y conversaciones.';

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-teal-950 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(94,234,212,0.28),transparent_38%),linear-gradient(120deg,#042f2e_0%,#115e59_58%,#0f766e_100%)]"
          aria-hidden="true"
        />
        <img
          src="/images/hero-car.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 bottom-0 hidden w-[360px] opacity-60 md:block"
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200">
            {rol}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Hola, {usuario?.nombres ?? 'usuario'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-teal-100">{descripcion}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/catalogo"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-medium text-teal-900 shadow-sm transition hover:bg-teal-50"
            >
              Explorar catálogo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/perfil"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/25 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Mi perfil
            </Link>
          </div>
        </div>
      </section>

      {!sinPanel && (
        <section className="space-y-4" aria-label="Resumen de actividad">
          {esAdmin && <PanelAdmin />}
          {esProveedor && <PanelProveedor />}
          {esCliente && <PanelCliente />}
        </section>
      )}

      {sinPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Sin panel asignado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Tu cuenta no tiene un rol con panel disponible. Contacta a un administrador.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
