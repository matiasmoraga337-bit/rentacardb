import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useToast } from '@/components/ui/toast';
import { cambiarEstadoProveedor, fetchProveedores, type EstadoProveedor, type Proveedor } from './api';

const ESTADOS: { value: EstadoProveedor | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADO', label: 'Aprobados' },
  { value: 'RECHAZADO', label: 'Rechazados' },
  { value: 'SUSPENDIDO', label: 'Suspendidos' },
  { value: 'INACTIVO', label: 'Inactivos' },
];

type Accion = {
  label: string;
  estado: EstadoProveedor;
  tone?: 'danger' | 'primary';
  requiereMotivo?: boolean;
};

function accionesDe(estado: string): Accion[] {
  if (estado === 'PENDIENTE') {
    return [
      { label: 'Aprobar', estado: 'APROBADO', tone: 'primary' },
      { label: 'Rechazar', estado: 'RECHAZADO', tone: 'danger', requiereMotivo: true },
    ];
  }
  if (estado === 'APROBADO') {
    return [
      { label: 'Suspender', estado: 'SUSPENDIDO', tone: 'danger', requiereMotivo: true },
      { label: 'Inactivar', estado: 'INACTIVO', tone: 'danger', requiereMotivo: true },
    ];
  }
  if (estado === 'SUSPENDIDO' || estado === 'INACTIVO') {
    return [{ label: 'Reactivar', estado: 'APROBADO', tone: 'primary' }];
  }
  if (estado === 'RECHAZADO') {
    return [{ label: 'Reabrir', estado: 'PENDIENTE', tone: 'primary' }];
  }
  return [];
}

function estadoClass(estado: string): string {
  if (estado === 'APROBADO') return 'bg-emerald-100 text-emerald-800';
  if (estado === 'PENDIENTE') return 'bg-amber-100 text-amber-800';
  if (estado === 'RECHAZADO') return 'bg-red-100 text-red-700';
  if (estado === 'SUSPENDIDO') return 'bg-orange-100 text-orange-800';
  return 'bg-slate-100 text-slate-600';
}

interface Confirmacion {
  proveedor: Proveedor;
  accion: Accion;
}

export function AdminProveedoresPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filtro, setFiltro] = useState<EstadoProveedor | ''>('');
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [motivo, setMotivo] = useState('');
  const query = useQuery({
    queryKey: ['admin-proveedores', filtro],
    queryFn: () => fetchProveedores(filtro || undefined),
  });

  const invalidar = (): void => {
    queryClient.invalidateQueries({ queryKey: ['admin-proveedores'] });
    queryClient.invalidateQueries({ queryKey: ['panel-admin-proveedores'] });
  };

  const cambiarMutation = useMutation({
    mutationFn: () =>
      confirmacion
        ? cambiarEstadoProveedor(confirmacion.proveedor.id, confirmacion.accion.estado, motivo || undefined)
        : Promise.reject(new Error('Sin confirmacion.')),
    onSuccess: () => {
      showToast('Estado del proveedor actualizado.');
      setConfirmacion(null);
      setMotivo('');
      invalidar();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'No se pudo actualizar el proveedor.', 'error');
    },
  });

  const abrirAccion = (proveedor: Proveedor, accion: Accion): void => {
    setConfirmacion({ proveedor, accion });
    setMotivo('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-slate-600">Aprueba, rechaza, suspende o reactiva proveedores.</p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            aria-label="Filtrar proveedores por estado"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value as EstadoProveedor | '')}
          >
            {ESTADOS.map((estado) => (
              <option key={estado.value} value={estado.value}>{estado.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>{query.data ? `${query.data.length} proveedor(es).` : 'Cargando proveedores.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <TableSkeleton />}
          {query.isError && <p className="text-sm text-red-600">No se pudieron cargar los proveedores.</p>}
          {query.data?.length === 0 && <p className="text-sm text-slate-500">Sin proveedores para este filtro.</p>}

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {query.data?.map((proveedor) => (
              <article key={proveedor.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Building2 className="h-4 w-4" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{proveedor.nombreComercial}</p>
                      <p className="text-xs text-slate-500">{proveedor.tipo}{proveedor.rut ? ` · ${proveedor.rut}` : ''}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${estadoClass(proveedor.estado)}`}>{proveedor.estado}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {proveedor.email && <p>{proveedor.email}</p>}
                  {proveedor.telefono && <p>{proveedor.telefono}</p>}
                  {proveedor.motivoBaja && <p className="text-red-700">Motivo: {proveedor.motivoBaja}</p>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {accionesDe(proveedor.estado).map((accion) => (
                    <Button key={accion.estado} size="sm" variant={accion.tone === 'danger' ? 'outline' : 'default'} onClick={() => abrirAccion(proveedor, accion)}>
                      {accion.label}
                    </Button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2 pr-3">Nombre</th><th className="py-2 pr-3">Tipo</th><th className="py-2 pr-3">Contacto</th><th className="py-2 pr-3">Estado</th><th className="py-2">Acciones</th></tr></thead>
              <tbody>
                {query.data?.map((proveedor) => (
                  <tr key={proveedor.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3 font-medium">{proveedor.nombreComercial}{proveedor.rut ? <span className="block text-xs font-normal text-slate-500">{proveedor.rut}</span> : null}</td>
                    <td className="py-3 pr-3">{proveedor.tipo}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500">{proveedor.email ?? '—'}{proveedor.telefono ? <span className="block">{proveedor.telefono}</span> : null}</td>
                    <td className="py-3 pr-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoClass(proveedor.estado)}`}>{proveedor.estado}</span>{proveedor.motivoBaja ? <span className="mt-1 block max-w-[180px] text-xs text-red-700">{proveedor.motivoBaja}</span> : null}</td>
                    <td className="space-x-2 py-3 text-right">
                      {accionesDe(proveedor.estado).map((accion) => (
                        <Button key={accion.estado} size="sm" variant={accion.tone === 'danger' ? 'outline' : 'default'} onClick={() => abrirAccion(proveedor, accion)}>{accion.label}</Button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {confirmacion && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><h2 id="confirm-title" className="text-lg font-semibold">{confirmacion.accion.label} proveedor</h2><p className="mt-1 text-sm text-slate-500">{confirmacion.proveedor.nombreComercial} pasara a estado {confirmacion.accion.estado}.</p></div>
              <button type="button" onClick={() => setConfirmacion(null)} aria-label="Cerrar" className="rounded-full p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            {confirmacion.accion.requiereMotivo && (
              <div className="mt-4 space-y-1"><label htmlFor="motivoEstado" className="text-sm font-medium text-slate-700">Motivo</label><textarea id="motivoEstado" value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={3} maxLength={300} className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Explica el motivo del cambio" /></div>
            )}
            <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmacion(null)}>Cancelar</Button><Button onClick={() => cambiarMutation.mutate()} disabled={cambiarMutation.isPending || (confirmacion.accion.requiereMotivo && !motivo.trim())}>{cambiarMutation.isPending ? 'Guardando…' : confirmacion.accion.label}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
