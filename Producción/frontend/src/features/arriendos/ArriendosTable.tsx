import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatearFechaHora } from '@/features/reservas/format';
import type { Arriendo } from './api';
import { EstadoArriendoBadge } from './EstadoArriendoBadge';

interface ArriendosTableProps {
  arriendos: Arriendo[];
  mostrarCliente?: boolean;
}

export function ArriendosTable({ arriendos, mostrarCliente = false }: ArriendosTableProps) {
  if (arriendos.length === 0) {
    return <p className="py-4 text-sm text-slate-500">No hay arriendos para mostrar.</p>;
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {arriendos.map((arriendo) => (
          <Link
            key={arriendo.id}
            to={`/arriendos/${arriendo.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Arriendo #{arriendo.id}</p>
                <p className="truncate font-semibold text-slate-900">
                  {arriendo.marca} {arriendo.modelo}
                </p>
                <p className="font-mono text-xs text-slate-500">{arriendo.patente}</p>
              </div>
              <EstadoArriendoBadge estado={arriendo.estado} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Retiro</dt>
                <dd className="mt-0.5 text-slate-700">
                  {formatearFechaHora(arriendo.fechaRetiro)}
                </dd>
                <dd className="text-xs text-slate-500">{arriendo.sedeRetiroReal}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Devolución</dt>
                <dd className="mt-0.5 text-slate-700">
                  {arriendo.fechaDevolucion
                    ? formatearFechaHora(arriendo.fechaDevolucion)
                    : 'Pendiente'}
                </dd>
                {arriendo.sedeDevolucionReal && (
                  <dd className="text-xs text-slate-500">{arriendo.sedeDevolucionReal}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kilometraje</dt>
                <dd className="mt-0.5 text-slate-700">
                  {arriendo.kmFinal !== null
                    ? `${arriendo.kmInicial.toLocaleString('es-CL')} → ${arriendo.kmFinal.toLocaleString('es-CL')}`
                    : `${arriendo.kmInicial.toLocaleString('es-CL')} km`}
                </dd>
              </div>
              {mostrarCliente && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Cliente</dt>
                  <dd className="mt-0.5 truncate text-slate-700">
                    {arriendo.cliente} · {arriendo.emailCliente}
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
              <th className="py-2 pr-3">Arriendo</th>
              <th className="py-2 pr-3">Vehiculo</th>
              {mostrarCliente && <th className="py-2 pr-3">Cliente</th>}
              <th className="py-2 pr-3">Retiro</th>
              <th className="py-2 pr-3">Devolucion</th>
              <th className="py-2 pr-3">Km</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {arriendos.map((arriendo) => (
              <tr key={arriendo.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-3 font-medium">#{arriendo.id}</td>
                <td className="py-3 pr-3">
                  <p className="font-medium">
                    {arriendo.marca} {arriendo.modelo}
                  </p>
                  <p className="text-xs text-slate-500">{arriendo.patente}</p>
                </td>
                {mostrarCliente && (
                  <td className="py-3 pr-3">
                    <p>{arriendo.cliente}</p>
                    <p className="text-xs text-slate-500">{arriendo.emailCliente}</p>
                  </td>
                )}
                <td className="py-3 pr-3">
                  <p>{formatearFechaHora(arriendo.fechaRetiro)}</p>
                  <p className="text-xs text-slate-500">{arriendo.sedeRetiroReal}</p>
                </td>
                <td className="py-3 pr-3">
                  {arriendo.fechaDevolucion ? (
                    <>
                      <p>{formatearFechaHora(arriendo.fechaDevolucion)}</p>
                      <p className="text-xs text-slate-500">{arriendo.sedeDevolucionReal}</p>
                    </>
                  ) : (
                    <span className="text-slate-500">Pendiente</span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  {arriendo.kmFinal !== null
                    ? `${arriendo.kmInicial.toLocaleString('es-CL')} → ${arriendo.kmFinal.toLocaleString('es-CL')}`
                    : `${arriendo.kmInicial.toLocaleString('es-CL')} km`}
                </td>
                <td className="py-3 pr-3">
                  <EstadoArriendoBadge estado={arriendo.estado} />
                </td>
                <td className="py-3 text-right">
                  <Link to={`/arriendos/${arriendo.id}`} className="text-brand hover:underline">
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
