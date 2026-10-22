import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';
import { EstadoPagoBadge } from '@/features/pagos/EstadoPagoBadge';
import { fetchPagos } from '@/features/pagos/api';
import { fetchHistorial, fetchReserva, fetchSnapshot } from './api';
import { CancelarReservaPanel } from './CancelarReservaPanel';
import { EstadoReservaBadge } from './EstadoReservaBadge';
import { formatearCLP, formatearFecha, formatearFechaHora, puedeCancelar } from './format';

export function ReservaDetallePage() {
  const { id } = useParams();
  const reservaId = Number(id);
  const { usuario } = useAuth();

  const reservaQuery = useQuery({
    queryKey: ['reserva', reservaId],
    queryFn: () => fetchReserva(reservaId),
    enabled: Number.isInteger(reservaId) && reservaId > 0,
  });

  const reserva = reservaQuery.data;
  const pagosQuery = useQuery({
    queryKey: ['pagos', reservaId],
    queryFn: () => fetchPagos(reservaId),
    enabled: Boolean(reserva),
  });
  const historialQuery = useQuery({
    queryKey: ['reserva-historial', reservaId],
    queryFn: () => fetchHistorial(reservaId),
    enabled: Boolean(reserva),
  });
  const snapshotQuery = useQuery({
    queryKey: ['reserva-snapshot', reservaId],
    queryFn: () => fetchSnapshot(reservaId),
    enabled: Boolean(reserva),
  });

  if (reservaQuery.isLoading) return <p className="text-slate-500">Cargando reserva…</p>;
  if (reservaQuery.isError || !reserva) {
    return <p className="text-sm text-red-600">No se pudo cargar la reserva.</p>;
  }

  const esPropietario = usuario?.id === reserva.idCliente;
  const puedePagar = esPropietario && reserva.estado === 'PENDIENTE';
  const puedeIniciar =
    reserva.estado === 'CONFIRMADA' &&
    Boolean(
      usuario?.roles.includes('PROVEEDOR') ||
        usuario?.roles.includes('OPERADOR') ||
        usuario?.roles.includes('ADMIN'),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Reserva #{reserva.id}</h1>
            <EstadoReservaBadge estado={reserva.estado} />
          </div>
          <p className="text-sm text-slate-600">
            Creada el {formatearFechaHora(reserva.fechaReserva)} · {reserva.proveedor}
          </p>
        </div>
        <div className="flex gap-2">
          {puedePagar && (
            <Link to={`/reservas/${reserva.id}/pagar`}>
              <Button>Pagar reserva</Button>
            </Link>
          )}
          {puedeIniciar && (
            <Link to={`/proveedor/arriendos/iniciar/${reserva.id}`}>
              <Button>Iniciar arriendo</Button>
            </Link>
          )}
          <Link to={esPropietario ? '/reservas' : '/proveedor/reservas'}>
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehiculo y fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-lg font-semibold">
              {reserva.marca} {reserva.modelo}
            </p>
            <p className="text-slate-600">{reserva.patente}</p>
            <p>
              <span className="font-medium">Retiro:</span> {formatearFecha(reserva.fechaInicio)} ·{' '}
              {reserva.sedeRetiro}
            </p>
            <p>
              <span className="font-medium">Devolucion:</span>{' '}
              {formatearFecha(reserva.fechaFin)} · {reserva.sedeDevolucion}
            </p>
            {reserva.observaciones && (
              <p className="text-slate-600">Observaciones: {reserva.observaciones}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Precio por dia</span>
              <span>{formatearCLP(reserva.precioDia)}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatearCLP(reserva.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuesto ({reserva.porcentajeImpuesto}%)</span>
              <span>{formatearCLP(reserva.impuesto)}</span>
            </div>
            {reserva.descuento > 0 && (
              <div className="flex justify-between">
                <span>Descuento</span>
                <span>-{formatearCLP(reserva.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatearCLP(reserva.total)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>Pago</span>
              <EstadoPagoBadge estado={reserva.estadoPago} />
            </div>
            {reserva.fechaExpiracion && reserva.estado === 'PENDIENTE' && (
              <p className="text-xs text-amber-700">
                La reserva expira el {formatearFechaHora(reserva.fechaExpiracion)}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">{reserva.cliente}</p>
          <p className="text-slate-600">{reserva.emailCliente}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>Transacciones registradas para la reserva.</CardDescription>
        </CardHeader>
        <CardContent>
          {pagosQuery.isLoading && <p className="text-sm text-slate-500">Cargando pagos…</p>}
          {pagosQuery.data && pagosQuery.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin pagos registrados.</p>
          )}
          {pagosQuery.data && pagosQuery.data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Pago</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Metodo</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagosQuery.data.map((pago) => (
                  <tr key={pago.id} className="border-b border-slate-100">
                    <td className="py-2">#{pago.id}</td>
                    <td className="py-2">{pago.tipoOperacion}</td>
                    <td className="py-2">{pago.metodo}</td>
                    <td className="py-2">{formatearCLP(pago.monto)}</td>
                    <td className="py-2">
                      <EstadoPagoBadge estado={pago.estado} />
                    </td>
                    <td className="py-2">{formatearFechaHora(pago.fechaPago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {reserva.reembolsos && reserva.reembolsos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reembolsos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {reserva.reembolsos.map((reembolso) => (
                <li key={reembolso.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium">
                    {formatearCLP(reembolso.monto)} · {reembolso.estado}
                  </p>
                  <p className="text-slate-600">{reembolso.motivo ?? 'Sin motivo informado.'}</p>
                  <p className="text-xs text-slate-500">
                    Solicitado el {formatearFechaHora(reembolso.fechaSolicitud)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {esPropietario && puedeCancelar(reserva.estado) && (
        <CancelarReservaPanel reserva={reserva} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de estados</CardTitle>
        </CardHeader>
        <CardContent>
          {historialQuery.data?.length === 0 && (
            <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
          )}
          <ul className="space-y-2 text-sm">
            {historialQuery.data?.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium">
                  {item.estadoAnterior ?? '—'} → {item.estadoNuevo}
                  {item.evento ? ` (${item.evento})` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {formatearFechaHora(item.fecha)} · {item.usuario ?? 'Sistema'}
                  {item.motivo ? ` · ${item.motivo}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot comercial</CardTitle>
          <CardDescription>Copia congelada de precios y condiciones al reservar.</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshotQuery.data?.length === 0 && (
            <p className="text-sm text-slate-500">Sin snapshot registrado.</p>
          )}
          {snapshotQuery.data?.slice(0, 1).map((snapshot) => (
            <div key={snapshot.ID_snapshot} className="space-y-1 text-sm">
              <p>
                Version {snapshot.version_snapshot} · Tarifa{' '}
                {snapshot.nombre_tarifa_reserva_snapshot ?? '—'}
              </p>
              <p>
                {snapshot.cantidad_dias_reserva_snapshot} dias · Total{' '}
                {formatearCLP(snapshot.total_reserva_snapshot)}
              </p>
              <p className="text-xs text-slate-500">
                Generado el {formatearFechaHora(snapshot.fecha_snapshot)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
