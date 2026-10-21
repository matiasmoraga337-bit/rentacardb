import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { formatearCLP } from '@/features/reservas/format';

interface IngresoMes {
  anio: number;
  mes: number;
  total_reservas: number;
  subtotal_bruto: number;
  descuentos: number;
  impuestos: number;
  total_exigible: number;
  total_depositos: number;
  total_reembolsos_liquidacion_proveedor: number;
  comisiones: number;
}

export function ReporteIngresosPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const query = useQuery({
    queryKey: ['reporte-ingresos', anio],
    queryFn: () => apiFetch<IngresoMes[]>(`/reportes/ingresos?anio=${anio}`),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reporte de ingresos</h1>
        <p className="text-sm text-slate-600">Ingresos mensuales por reservas confirmadas.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between space-y-0">
          <div>
            <CardTitle>Ingresos por mes</CardTitle>
            <CardDescription>Datos obtenidos con u_sp_ReporteIngresosMensuales.</CardDescription>
          </div>
          <div className="w-32 space-y-1">
            <Label htmlFor="anio">Año</Label>
            <Input
              id="anio"
              type="number"
              min={2000}
              max={2100}
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
            />
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading && <p className="text-slate-500">Cargando reporte…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
          {query.data && query.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin ingresos registrados para el año.</p>
          )}
          {query.data && query.data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Mes</th>
                  <th className="py-2">Reservas</th>
                  <th className="py-2">Subtotal</th>
                  <th className="py-2">Impuestos</th>
                  <th className="py-2">Total exigible</th>
                  <th className="py-2">Comisiones</th>
                  <th className="py-2">Reembolsos</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((row) => (
                  <tr key={`${row.anio}-${row.mes}`} className="border-b border-slate-100">
                    <td className="py-2">
                      {new Date(row.anio, row.mes - 1, 1).toLocaleDateString('es-CL', {
                        month: 'long',
                      })}
                    </td>
                    <td className="py-2">{row.total_reservas}</td>
                    <td className="py-2">{formatearCLP(row.subtotal_bruto)}</td>
                    <td className="py-2">{formatearCLP(row.impuestos)}</td>
                    <td className="py-2 font-medium">{formatearCLP(row.total_exigible)}</td>
                    <td className="py-2">{formatearCLP(row.comisiones)}</td>
                    <td className="py-2">
                      {formatearCLP(row.total_reembolsos_liquidacion_proveedor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
