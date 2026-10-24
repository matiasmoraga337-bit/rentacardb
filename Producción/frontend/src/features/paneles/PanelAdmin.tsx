import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Car, Clock3, CreditCard, KeyRound, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPagosPendientes, fetchVehiculosPublicados } from '@/features/admin/api';
import { apiFetch } from '@/lib/api';
import { fetchArriendos } from '@/features/arriendos/api';
import { fetchProveedores } from '@/features/proveedores/api';
import { fetchReservas } from '@/features/reservas/api';
import { EstadoReservaBadge } from '@/features/reservas/EstadoReservaBadge';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import { MetricCard } from './MetricCard';

interface IngresoMes {
  anio: number;
  mes: number;
  comisiones: number;
}

export function PanelAdmin() {
  const anio = new Date().getFullYear();
  const proveedores = useQuery({ queryKey: ['panel-admin-proveedores'], queryFn: () => fetchProveedores() });
  const reservas = useQuery({
    queryKey: ['panel-admin-reservas'],
    queryFn: () => fetchReservas({ scope: 'todos', page: 1, pageSize: 5 }),
  });
  const arriendos = useQuery({
    queryKey: ['panel-admin-arriendos'],
    queryFn: () => fetchArriendos({ scope: 'todos', page: 1, pageSize: 1 }),
  });
  const ingresos = useQuery({
    queryKey: ['panel-admin-ingresos', anio],
    queryFn: () => apiFetch<IngresoMes[]>(`/reportes/ingresos?anio=${anio}`),
  });

  const pagosPendientes = useQuery({
    queryKey: ['panel-admin-pagos-pendientes'],
    queryFn: () => fetchPagosPendientes(5),
  });
  const publicados = useQuery({
    queryKey: ['panel-admin-vehiculos-publicados'],
    queryFn: () => fetchVehiculosPublicados(5),
  });

  const pendientes = proveedores.data?.filter((proveedor) => proveedor.estado === 'PENDIENTE') ?? [];
  const comisiones = ingresos.data?.reduce((total, mes) => total + mes.comisiones, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Proveedores"
          value={proveedores.data?.length ?? '—'}
          icon={Users}
          loading={proveedores.isLoading}
        />
        <MetricCard
          title="Pendientes de aprobación"
          value={pendientes.length}
          icon={Clock3}
          loading={proveedores.isLoading}
        />
        <MetricCard
          title="Reservas"
          value={reservas.data?.total ?? '—'}
          icon={CalendarDays}
          loading={reservas.isLoading}
        />
        <MetricCard
          title="Alquileres"
          value={arriendos.data?.total ?? '—'}
          icon={KeyRound}
          loading={arriendos.isLoading}
        />
        <MetricCard
          title="Pagos pendientes"
          value={pagosPendientes.data?.total ?? '—'}
          icon={CreditCard}
          loading={pagosPendientes.isLoading}
        />
        <MetricCard
          title="Vehículos publicados"
          value={publicados.data?.total ?? '—'}
          icon={Car}
          loading={publicados.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proveedores pendientes</CardTitle>
            <CardDescription>Requieren revision para operar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {proveedores.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {proveedores.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los proveedores.</p>
            )}
            {pendientes.length === 0 && (
              <p className="text-sm text-slate-500">Sin proveedores pendientes.</p>
            )}
            {pendientes.slice(0, 5).map((proveedor) => (
              <div
                key={proveedor.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{proveedor.nombreComercial}</p>
                  <p className="text-slate-500">{proveedor.tipo}</p>
                </div>
                <span className="text-xs text-amber-700">{proveedor.estado}</span>
              </div>
            ))}
            <Link to="/admin/proveedores" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Gestionar proveedores
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas reservas</CardTitle>
            <CardDescription>Actividad reciente de la plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reservas.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {reservas.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar las reservas.</p>
            )}
            {reservas.data?.data.length === 0 && (
              <p className="text-sm text-slate-500">Sin reservas registradas.</p>
            )}
            {reservas.data?.data.map((reserva) => (
              <Link
                key={reserva.id}
                to={`/reservas/${reserva.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">
                    #{reserva.id} · {reserva.marca} {reserva.modelo}
                  </p>
                  <p className="text-slate-500">
                    {reserva.cliente} · {formatearFecha(reserva.fechaInicio)} ·{' '}
                    {formatearCLP(reserva.total)}
                  </p>
                </div>
                <EstadoReservaBadge estado={reserva.estado} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pagos pendientes</CardTitle>
            <CardDescription>Pagos registrados sin confirmar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pagosPendientes.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {pagosPendientes.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los pagos.</p>
            )}
            {pagosPendientes.data?.rows.length === 0 && (
              <p className="text-sm text-slate-500">Sin pagos pendientes.</p>
            )}
            {pagosPendientes.data?.rows.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    Reserva #{pago.reservaId} · {pago.metodo}
                  </p>
                  <p className="text-slate-500">
                    {formatearCLP(pago.monto)} · {formatearFecha(pago.fecha)}
                  </p>
                </div>
                <span className="text-xs text-amber-700">{pago.estado}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehículos publicados</CardTitle>
            <CardDescription>Flota visible en el catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {publicados.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {publicados.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los vehículos.</p>
            )}
            {publicados.data?.rows.length === 0 && (
              <p className="text-sm text-slate-500">Sin vehículos publicados.</p>
            )}
            {publicados.data?.rows.map((vehiculo) => (
              <div
                key={vehiculo.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {vehiculo.marca} {vehiculo.modelo} · {vehiculo.patente}
                  </p>
                  <p className="text-slate-500">
                    {vehiculo.proveedor} · {vehiculo.comuna ?? 'Sin comuna'}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{vehiculo.region}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comisiones {anio}</CardTitle>
          <CardDescription>Total de comisiones registradas en el año.</CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-brand">
          {ingresos.isLoading ? 'Cargando…' : formatearCLP(comisiones)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/admin/proveedores">
            <Button variant="outline">Proveedores</Button>
          </Link>
          <Link to="/admin/reportes">
            <Button variant="outline">Reporte de ingresos</Button>
          </Link>
          <Link to="/admin/catalogos">
            <Button variant="outline">Catalogos</Button>
          </Link>
          <Link to="/admin/auditoria">
            <Button variant="outline">Auditoria</Button>
          </Link>
          <Link to="/admin/disputas">
            <Button variant="outline">Disputas</Button>
          </Link>
          <Link to="/admin/liquidaciones">
            <Button variant="outline">Liquidaciones</Button>
          </Link>
          <Link to="/admin/outbox">
            <Button variant="outline">Outbox</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
