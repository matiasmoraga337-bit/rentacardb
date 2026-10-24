import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  fetchIntegridad,
  fetchReporteLiquidaciones,
  fetchReporteProveedores,
  fetchReporteTiposProveedor,
} from '@/features/admin/api';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import { apiFetch } from '@/lib/api';

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

type Tab = 'ingresos' | 'liquidaciones' | 'proveedores' | 'tipos' | 'integridad';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'tipos', label: 'Tipos de proveedor' },
  { id: 'integridad', label: 'Integridad' },
];

function ReporteIngresosTab() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const query = useQuery({
    queryKey: ['reporte-ingresos', anio],
    queryFn: () => apiFetch<IngresoMes[]>(`/reportes/ingresos?anio=${anio}`),
  });

  return (
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
        {query.isLoading && <TableSkeleton rows={6} />}
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
                      <td className="py-3">{formatearCLP(row.total_reembolsos_liquidacion_proveedor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReporteLiquidacionesTab() {
  const query = useQuery({
    queryKey: ['reporte-liquidaciones'],
    queryFn: fetchReporteLiquidaciones,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidaciones por proveedor</CardTitle>
        <CardDescription>Datos obtenidos con u_sp_ReporteLiquidaciones.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading && <TableSkeleton rows={5} />}
        {query.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {query.data?.length === 0 && (
          <p className="text-sm text-slate-500">Sin liquidaciones registradas.</p>
        )}
        {query.data && query.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Proveedor</th>
                  <th className="py-2 pr-3">Período</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Bruto</th>
                  <th className="py-2 pr-3">Comisión</th>
                  <th className="py-2 pr-3">Neto</th>
                  <th className="py-2">Pago</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((row) => (
                  <tr key={row.ID_liquidacion} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-medium">{row.nombre_comercial_proveedor}</td>
                    <td className="py-3 pr-3">
                      {formatearFecha(row.periodo_desde_liquidacion)} →{' '}
                      {formatearFecha(row.periodo_hasta_liquidacion)}
                    </td>
                    <td className="py-3 pr-3">{row.nombre_estado_liquidacion}</td>
                    <td className="py-3 pr-3">{formatearCLP(row.monto_bruto_liquidacion)}</td>
                    <td className="py-3 pr-3">{formatearCLP(row.monto_comision_liquidacion)}</td>
                    <td className="py-3 pr-3 font-medium">{formatearCLP(row.monto_neto_liquidacion)}</td>
                    <td className="py-3">
                      {row.fecha_pago_liquidacion
                        ? formatearFecha(row.fecha_pago_liquidacion)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReporteProveedoresTab() {
  const query = useQuery({
    queryKey: ['reporte-proveedores'],
    queryFn: fetchReporteProveedores,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad por proveedor</CardTitle>
        <CardDescription>Datos obtenidos con u_sp_ReporteProveedores.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading && <TableSkeleton rows={5} />}
        {query.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {query.data?.length === 0 && (
          <p className="text-sm text-slate-500">Sin proveedores registrados.</p>
        )}
        {query.data && query.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Proveedor</th>
                  <th className="py-2 pr-3">Vehículos</th>
                  <th className="py-2 pr-3">Publicados</th>
                  <th className="py-2 pr-3">Reservas</th>
                  <th className="py-2">Total pagado</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((row) => (
                  <tr key={row.ID_proveedor} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-medium">{row.nombre_proveedor}</td>
                    <td className="py-3 pr-3">{row.cantidad_vehiculos}</td>
                    <td className="py-3 pr-3">{row.cantidad_publicados}</td>
                    <td className="py-3 pr-3">{row.cantidad_reservas}</td>
                    <td className="py-3">{formatearCLP(row.total_pagado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReporteTiposProveedorTab() {
  const query = useQuery({
    queryKey: ['reporte-tipos-proveedor'],
    queryFn: fetchReporteTiposProveedor,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores por tipo</CardTitle>
        <CardDescription>Datos obtenidos con u_sp_ReporteTiposProveedor.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading && <TableSkeleton rows={4} />}
        {query.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {query.data?.length === 0 && (
          <p className="text-sm text-slate-500">Sin tipos de proveedor registrados.</p>
        )}
        {query.data && query.data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((row) => (
                <tr key={row.nombre_tipo_proveedor} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-medium">{row.nombre_tipo_proveedor}</td>
                  <td className="py-3">{row.cantidad_proveedores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function ReporteIntegridadTab() {
  const query = useQuery({
    queryKey: ['reporte-integridad'],
    queryFn: fetchIntegridad,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salud de datos</CardTitle>
        <CardDescription>Validación con u_sp_ValidarIntegridad.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading && <TableSkeleton rows={3} />}
        {query.isError && <p className="text-sm text-red-600">No se pudo validar la integridad.</p>}
        {query.data && (
          <p
            className={
              query.data.ok
                ? 'rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-700'
                : 'rounded-md bg-red-50 p-3 text-sm font-medium text-red-700'
            }
          >
            {query.data.ok
              ? 'Sin errores de integridad detectados.'
              : `${query.data.errores.length} tipo(s) de error detectado(s).`}
          </p>
        )}
        {query.data && query.data.errores.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Cantidad</th>
                <th className="py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {query.data.errores.map((error) => (
                <tr key={error.codigo} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-mono text-xs">{error.codigo}</td>
                  <td className="py-3 pr-3">{error.cantidad}</td>
                  <td className="py-3">{error.descripcion_movimiento_financiero}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export function ReporteIngresosPage() {
  const [tab, setTab] = useState<Tab>('ingresos');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-slate-600">
          Ingresos, liquidaciones, proveedores y salud de los datos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Reportes disponibles">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === 'ingresos' && <ReporteIngresosTab />}
      {tab === 'liquidaciones' && <ReporteLiquidacionesTab />}
      {tab === 'proveedores' && <ReporteProveedoresTab />}
      {tab === 'tipos' && <ReporteTiposProveedorTab />}
      {tab === 'integridad' && <ReporteIntegridadTab />}
    </div>
  );
}
