import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, KeyRound, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchArriendos } from '@/features/arriendos/api';
import { fetchConversaciones } from '@/features/chat/api';
import { EstadoPagoBadge } from '@/features/pagos/EstadoPagoBadge';
import { fetchReservas } from '@/features/reservas/api';
import { EstadoReservaBadge } from '@/features/reservas/EstadoReservaBadge';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import { MetricCard } from './MetricCard';

export function PanelCliente() {
  const reservas = useQuery({
    queryKey: ['panel-cliente-reservas'],
    queryFn: () => fetchReservas({ scope: 'cliente', page: 1, pageSize: 5 }),
  });
  const confirmadas = useQuery({
    queryKey: ['panel-cliente-confirmadas'],
    queryFn: () =>
      fetchReservas({ scope: 'cliente', estado: 'CONFIRMADA', page: 1, pageSize: 1 }),
  });
  const arriendos = useQuery({
    queryKey: ['panel-cliente-arriendos'],
    queryFn: () => fetchArriendos({ scope: 'cliente', page: 1, pageSize: 1 }),
  });
  const chat = useQuery({
    queryKey: ['panel-cliente-chat'],
    queryFn: fetchConversaciones,
  });

  const noLeidos = chat.data?.reduce((total, conversacion) => total + conversacion.noLeidos, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Reservas"
          value={reservas.data?.total ?? '—'}
          icon={CalendarDays}
        />
        <MetricCard
          title="Confirmadas"
          value={confirmadas.data?.total ?? '—'}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Alquileres"
          value={arriendos.data?.total ?? '—'}
          icon={KeyRound}
        />
        <MetricCard
          title="Mensajes sin leer"
          value={noLeidos}
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas reservas</CardTitle>
            <CardDescription>Tus 5 reservas más recientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reservas.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {reservas.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar las reservas.</p>
            )}
            {reservas.data?.data.length === 0 && (
              <p className="text-sm text-slate-500">Aún no tienes reservas.</p>
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
                    {formatearFecha(reserva.fechaInicio)} → {formatearFecha(reserva.fechaFin)} ·{' '}
                    {formatearCLP(reserva.total)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <EstadoReservaBadge estado={reserva.estado} />
                  <EstadoPagoBadge estado={reserva.estadoPago} />
                </div>
              </Link>
            ))}
            <Link to="/reservas" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
            <CardDescription>Mensajes con proveedores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {chat.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
            {chat.isError && <p className="text-sm text-red-600">No se pudo cargar el chat.</p>}
            {chat.data?.length === 0 && (
              <p className="text-sm text-slate-500">Sin conversaciones.</p>
            )}
            {chat.data?.slice(0, 5).map((conversacion) => (
              <Link
                key={conversacion.id}
                to={`/chat/${conversacion.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{conversacion.proveedor}</p>
                  <p className="truncate text-slate-500">
                    {conversacion.ultimoMensaje ?? 'Sin mensajes'}
                  </p>
                </div>
                {conversacion.noLeidos > 0 && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                    {conversacion.noLeidos}
                  </span>
                )}
              </Link>
            ))}
            <Link to="/chat" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Abrir chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/catalogo">
            <Button variant="outline">Buscar vehículos</Button>
          </Link>
          <Link to="/reservas">
            <Button variant="outline">Mis reservas</Button>
          </Link>
          <Link to="/arriendos">
            <Button variant="outline">Mis alquileres</Button>
          </Link>
          <Link to="/disputas">
            <Button variant="outline">Disputas</Button>
          </Link>
          <Link to="/favoritos">
            <Button variant="outline">Favoritos</Button>
          </Link>
          <Link to="/busquedas">
            <Button variant="outline">Búsquedas guardadas</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
