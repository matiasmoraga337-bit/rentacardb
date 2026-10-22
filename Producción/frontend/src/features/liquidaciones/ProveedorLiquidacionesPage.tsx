import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { formatearCLP, formatearFecha, formatearFechaHora } from '@/features/reservas/format';
import { fetchLiquidaciones, type EstadoLiquidacion } from './api';

export function ProveedorLiquidacionesPage() {
  const [estado, setEstado] = useState<EstadoLiquidacion | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const query = useQuery({
    queryKey: ['liquidaciones-proveedor', estado, page],
    queryFn: () => fetchLiquidaciones({ estado: estado || undefined, page, pageSize }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mis liquidaciones</h1>
        <p className="text-sm text-slate-600">Liquidaciones calculadas, aprobadas y pagadas.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Historial</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} liquidacion(es).` : 'Cargando…'}
            </CardDescription>
          </div>
          <div className="w-48">
            <Select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value as EstadoLiquidacion | '');
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="CALCULADA">Calculada</option>
              <option value="APROBADA">Aprobada</option>
              <option value="PAGADA">Pagada</option>
              <option value="ANULADA">Anulada</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las liquidaciones.</p>
          )}
          {query.data?.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin liquidaciones registradas.</p>
          )}
          {query.data?.data.map((liquidacion) => (
            <div key={liquidacion.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {formatearFecha(liquidacion.periodoInicio)} →{' '}
                    {formatearFecha(liquidacion.periodoFin)}
                  </p>
                  <p className="text-slate-500">
                    Bruto {formatearCLP(liquidacion.totalBruto)} · Comision{' '}
                    {formatearCLP(liquidacion.totalComision)} · Reembolsos{' '}
                    {formatearCLP(liquidacion.totalReembolsos)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Generada {formatearFechaHora(liquidacion.fechaGeneracion)}
                    {liquidacion.fechaPago
                      ? ` · Pagada ${formatearFechaHora(liquidacion.fechaPago)}`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-brand">
                    {formatearCLP(liquidacion.totalNeto)}
                  </p>
                  <p className="text-xs text-slate-500">{liquidacion.estado}</p>
                </div>
              </div>
            </div>
          ))}
          {query.data && query.data.total > pageSize && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Pagina {page} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((value) => Math.min(totalPaginas, value + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
