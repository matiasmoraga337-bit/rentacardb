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
        <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Ingresos por mes</CardTitle>
            <CardDescription>Datos obtenidos con u_sp_ReporteIngresosMensuales.</CardDescription>
          </div>
          <div className="w-full space-y-1 sm:w-32">
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
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {query.data.map((row) => (
                  <article
                    key={`${row.anio}-${row.mes}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold capitalize text-slate-900">
                        {new Date(row.anio, row.mes - 1, 1).toLocaleDateString('es-CL', {
                          month: 'long',
                        })}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {row.total_reservas} reservas
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Total exigible</dt>
                        <dd className="mt-0.5 font-semibold text-brand">
                          {formatearCLP(row.total_exigible)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Comisiones</dt>
                        <dd className="mt-0.5">{formatearCLP(row.comisiones)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Subtotal</dt>
                        <dd className="mt-0.5">{formatearCLP(row.subtotal_bruto)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Impuestos</dt>
                        <dd className="mt-0.5">{formatearCLP(row.impuestos)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs text-slate-500">Reembolsos</dt>
                        <dd className="mt-0.5">
                          {formatearCLP(row.total_reembolsos_liquidacion_proveedor)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">Mes</th>
                      <th className="py-2 pr-3">Reservas</th>
                      <th className="py-2 pr-3">Subtotal</th>
                      <th className="py-2 pr-3">Impuestos</th>
                      <th className="py-2 pr-3">Total exigible</th>
                      <th className="py-2 pr-3">Comisiones</th>
                      <th className="py-2">Reembolsos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.map((row) => (
                      <tr key={`${row.anio}-${row.mes}`} className="border-b border-slate-100">
                        <td className="py-3 pr-3 capitalize">
                          {new Date(row.anio, row.mes - 1, 1).toLocaleDateString('es-CL', {
                            month: 'long',
                          })}
                        </td>
                        <td className="py-3 pr-3">{row.total_reservas}</td>
                        <td className="py-3 pr-3">{formatearCLP(row.subtotal_bruto)}</td>
                        <td className="py-3 pr-3">{formatearCLP(row.impuestos)}</td>
                        <td className="py-3 pr-3 font-medium">
                          {formatearCLP(row.total_exigible)}
                        </td>
                        <td className="py-3 pr-3">{formatearCLP(row.comisiones)}</td>
                        <td className="py-3">
                          {formatearCLP(row.total_reembolsos_liquidacion_proveedor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
