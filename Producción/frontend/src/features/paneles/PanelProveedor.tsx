import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Car, KeyRound, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchArriendos } from '@/features/arriendos/api';
import { EstadoArriendoBadge } from '@/features/arriendos/EstadoArriendoBadge';
import { fetchConversaciones } from '@/features/chat/api';
import { fetchReservas } from '@/features/reservas/api';
import { EstadoReservaBadge } from '@/features/reservas/EstadoReservaBadge';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import { fetchMisVehiculos } from '@/features/vehiculos/api';
import { fetchMio } from '@/features/proveedores/api';
import { MetricCard } from './MetricCard';

export function PanelProveedor() {
  const proveedor = useQuery({ queryKey: ['proveedor-mio'], queryFn: fetchMio, retry: false });
  const vehiculos = useQuery({ queryKey: ['panel-proveedor-vehiculos'], queryFn: fetchMisVehiculos });
  const reservas = useQuery({
    queryKey: ['panel-proveedor-reservas'],
    queryFn: () => fetchReservas({ scope: 'proveedor', page: 1, pageSize: 5 }),
  });
  const confirmadas = useQuery({
    queryKey: ['panel-proveedor-confirmadas'],
    queryFn: () =>
      fetchReservas({ scope: 'proveedor', estado: 'CONFIRMADA', page: 1, pageSize: 1 }),
  });
  const arriendos = useQuery({
    queryKey: ['panel-proveedor-arriendos'],
    queryFn: () =>
      fetchArriendos({ scope: 'proveedor', estado: 'ACTIVO', page: 1, pageSize: 5 }),
  });
  const chat = useQuery({ queryKey: ['panel-proveedor-chat'], queryFn: fetchConversaciones });

  const noLeidos = chat.data?.reduce((total, conversacion) => total + conversacion.noLeidos, 0) ?? 0;

  if (proveedor.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aún no eres proveedor</CardTitle>
          <CardDescription>Registra tu proveedor para acceder al panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/proveedor/registro">
            <Button>Registrarme como proveedor</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Vehículos"
          value={vehiculos.data?.length ?? '—'}
          icon={Car}
          loading={vehiculos.isLoading}
        />
        <MetricCard
          title="Reservas confirmadas"
          value={confirmadas.data?.total ?? '—'}
          icon={CalendarCheck}
          loading={confirmadas.isLoading}
        />
        <MetricCard
          title="Arriendos activos"
          value={arriendos.data?.total ?? '—'}
          icon={KeyRound}
          loading={arriendos.isLoading}
        />
        <MetricCard
          title="Mensajes sin leer"
          value={noLeidos}
          icon={MessageSquare}
          loading={chat.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas reservas</CardTitle>
            <CardDescription>Reservas recientes de tus vehículos.</CardDescription>
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
                    {reserva.cliente} · {formatearFecha(reserva.fechaInicio)} →{' '}
                    {formatearFecha(reserva.fechaFin)} · {formatearCLP(reserva.total)}
                  </p>
                </div>
                <EstadoReservaBadge estado={reserva.estado} />
              </Link>
            ))}
            <Link to="/proveedor/reservas" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Ver reservas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arriendos activos</CardTitle>
            <CardDescription>Vehículos actualmente en arriendo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {arriendos.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {arriendos.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los arriendos.</p>
            )}
            {arriendos.data?.data.length === 0 && (
              <p className="text-sm text-slate-500">Sin arriendos activos.</p>
            )}
            {arriendos.data?.data.map((arriendo) => (
              <Link
                key={arriendo.id}
                to={`/arriendos/${arriendo.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">
                    #{arriendo.id} · {arriendo.marca} {arriendo.modelo}
                  </p>
                  <p className="text-slate-500">
                    {arriendo.cliente} · desde {formatearFecha(arriendo.fechaInicio)}
                  </p>
                </div>
                <EstadoArriendoBadge estado={arriendo.estado} />
              </Link>
            ))}
            <Link to="/proveedor/arriendos" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Ver arriendos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/proveedor/vehiculos">
              <Button variant="outline">Mis vehículos</Button>
            </Link>
            <Link to="/proveedor/panel">
              <Button variant="outline">Configuración y sedes</Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline">Chat</Button>
            </Link>
            <Link to="/disputas">
              <Button variant="outline">Disputas</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liquidaciones</CardTitle>
            <CardDescription>Consulta tus liquidaciones calculadas, aprobadas y pagadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/proveedor/liquidaciones">
              <Button variant="outline">Ver liquidaciones</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
