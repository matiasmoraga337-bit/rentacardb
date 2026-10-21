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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
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
  );
}
