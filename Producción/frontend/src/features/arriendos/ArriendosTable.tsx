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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
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
  );
}
