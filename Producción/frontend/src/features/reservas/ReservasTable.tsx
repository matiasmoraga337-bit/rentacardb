import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatearCLP, formatearFecha } from './format';
import { EstadoReservaBadge } from './EstadoReservaBadge';
import type { Reserva } from './api';

interface ReservasTableProps {
  reservas: Reserva[];
  mostrarCliente?: boolean;
  mostrarProveedor?: boolean;
}

export function ReservasTable({
  reservas,
  mostrarCliente = false,
  mostrarProveedor = false,
}: ReservasTableProps) {
  if (reservas.length === 0) {
    return <p className="py-4 text-sm text-slate-500">No hay reservas para mostrar.</p>;
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {reservas.map((reserva) => (
          <Link
            key={reserva.id}
            to={`/reservas/${reserva.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Reserva #{reserva.id}</p>
                <p className="truncate font-semibold text-slate-900">
                  {reserva.marca} {reserva.modelo}
                </p>
                <p className="font-mono text-xs text-slate-500">{reserva.patente}</p>
              </div>
              <EstadoReservaBadge estado={reserva.estado} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Fechas</dt>
                <dd className="mt-0.5 text-slate-700">
                  {formatearFecha(reserva.fechaInicio)} → {formatearFecha(reserva.fechaFin)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Total</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {formatearCLP(reserva.total)}
                </dd>
              </div>
              {mostrarProveedor && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Proveedor</dt>
                  <dd className="mt-0.5 truncate text-slate-700">{reserva.proveedor}</dd>
                </div>
              )}
              {mostrarCliente && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Cliente</dt>
                  <dd className="mt-0.5 truncate text-slate-700">
                    {reserva.cliente} · {reserva.emailCliente}
                  </dd>
                </div>
              )}
            </dl>

            <span className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-medium text-brand">
              Ver detalle
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3">Reserva</th>
              <th className="py-2 pr-3">Vehiculo</th>
              {mostrarProveedor && <th className="py-2 pr-3">Proveedor</th>}
              {mostrarCliente && <th className="py-2 pr-3">Cliente</th>}
              <th className="py-2 pr-3">Fechas</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva) => (
              <tr key={reserva.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-3 font-medium">#{reserva.id}</td>
                <td className="py-3 pr-3">
                  <p className="font-medium">
                    {reserva.marca} {reserva.modelo}
                  </p>
                  <p className="text-xs text-slate-500">{reserva.patente}</p>
                </td>
                {mostrarProveedor && <td className="py-3 pr-3">{reserva.proveedor}</td>}
                {mostrarCliente && (
                  <td className="py-3 pr-3">
                    <p>{reserva.cliente}</p>
                    <p className="text-xs text-slate-500">{reserva.emailCliente}</p>
                  </td>
                )}
                <td className="py-3 pr-3">
                  {formatearFecha(reserva.fechaInicio)} → {formatearFecha(reserva.fechaFin)}
                </td>
                <td className="py-3 pr-3 font-medium">{formatearCLP(reserva.total)}</td>
                <td className="py-3 pr-3">
                  <EstadoReservaBadge estado={reserva.estado} />
                </td>
                <td className="py-3 text-right">
                  <Link to={`/reservas/${reserva.id}`} className="text-brand hover:underline">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
