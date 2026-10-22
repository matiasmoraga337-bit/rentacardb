import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { fetchProveedores } from '@/features/proveedores/api';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import {
  aprobarLiquidacion,
  crearLiquidacion,
  fetchLiquidaciones,
  pagarLiquidacion,
  type EstadoLiquidacion,
} from './api';

const hoy = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const inicioMes = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-01`;
};

export function AdminLiquidacionesPage() {
  const queryClient = useQueryClient();
  const proveedores = useQuery({ queryKey: ['admin-proveedores'], queryFn: () => fetchProveedores() });
  const [idProveedor, setIdProveedor] = useState<number | undefined>();
  const [inicio, setInicio] = useState(inicioMes());
  const [fin, setFin] = useState(hoy());
  const [estado, setEstado] = useState<EstadoLiquidacion | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const query = useQuery({
    queryKey: ['liquidaciones', estado, page],
    queryFn: () =>
      fetchLiquidaciones({ estado: estado || undefined, page, pageSize }),
  });

  const crearMutation = useMutation({
    mutationFn: () =>
      crearLiquidacion({
        ID_proveedor: idProveedor as number,
        periodo_inicio: inicio,
        periodo_fin: fin,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liquidaciones'] }),
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => aprobarLiquidacion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liquidaciones'] }),
  });

  const pagarMutation = useMutation({
    mutationFn: (id: number) => pagarLiquidacion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liquidaciones'] }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Liquidaciones</h1>
        <p className="text-sm text-slate-600">
          Genera, aprueba y paga liquidaciones por proveedor y periodo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar liquidacion</CardTitle>
          <CardDescription>Calcula desde los movimientos financieros del periodo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="liqProveedor">Proveedor</Label>
              <Select
                id="liqProveedor"
                value={idProveedor ?? ''}
                onChange={(event) =>
                  setIdProveedor(event.target.value ? Number(event.target.value) : undefined)
                }
              >
                <option value="">Selecciona proveedor</option>
                {proveedores.data?.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombreComercial}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="liqInicio">Desde</Label>
              <Input
                id="liqInicio"
                type="date"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="liqFin">Hasta</Label>
              <Input
                id="liqFin"
                type="date"
                value={fin}
                onChange={(event) => setFin(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={crearMutation.isPending || !idProveedor || !inicio || !fin}
                onClick={() => crearMutation.mutate()}
              >
                {crearMutation.isPending ? 'Generando…' : 'Generar'}
              </Button>
            </div>
          </div>
          {crearMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              {crearMutation.error instanceof Error
                ? crearMutation.error.message
                : 'No se pudo generar la liquidacion.'}
            </p>
          )}
          {crearMutation.isSuccess && (
            <p className="mt-2 text-sm text-emerald-700">Liquidacion generada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Listado</CardTitle>
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
          {query.data?.data.length ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Proveedor</th>
                  <th className="py-2">Periodo</th>
                  <th className="py-2">Bruto</th>
                  <th className="py-2">Comision</th>
                  <th className="py-2">Neto</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((liquidacion) => (
                  <tr key={liquidacion.id} className="border-b border-slate-100">
                    <td className="py-2">{liquidacion.proveedor}</td>
                    <td className="py-2">
                      {formatearFecha(liquidacion.periodoInicio)} →{' '}
                      {formatearFecha(liquidacion.periodoFin)}
                    </td>
                    <td className="py-2">{formatearCLP(liquidacion.totalBruto)}</td>
                    <td className="py-2">{formatearCLP(liquidacion.totalComision)}</td>
                    <td className="py-2 font-medium">{formatearCLP(liquidacion.totalNeto)}</td>
                    <td className="py-2">{liquidacion.estado}</td>
                    <td className="space-x-2 py-2 text-right">
                      {liquidacion.estado === 'CALCULADA' && (
                        <Button
                          size="sm"
                          disabled={aprobarMutation.isPending}
                          onClick={() => aprobarMutation.mutate(liquidacion.id)}
                        >
                          Aprobar
                        </Button>
                      )}
                      {liquidacion.estado === 'APROBADA' && (
                        <Button
                          size="sm"
                          disabled={pagarMutation.isPending}
                          onClick={() => pagarMutation.mutate(liquidacion.id)}
                        >
                          Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
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
