import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useToast } from '@/components/ui/toast';
import { aprobarProveedor, fetchProveedores } from './api';

function estadoClass(estado: string): string {
  if (estado === 'APROBADO') return 'bg-emerald-100 text-emerald-800';
  if (estado === 'PENDIENTE') return 'bg-amber-100 text-amber-800';
  if (estado === 'RECHAZADO') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

export function AdminProveedoresPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({ queryKey: ['admin-proveedores'], queryFn: () => fetchProveedores() });

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => aprobarProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proveedores'] });
      showToast('Proveedor aprobado.');
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'No se pudo aprobar el proveedor.',
        'error',
      );
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <p className="text-sm text-slate-600">Aprueba proveedores pendientes y revisa la red.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.length} proveedor(es).` : 'Cargando proveedores.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <TableSkeleton />}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar los proveedores.</p>
          )}
          {query.data?.length === 0 && (
            <p className="text-sm text-slate-500">Sin proveedores.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {query.data?.map((proveedor) => (
              <article
                key={proveedor.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {proveedor.nombreComercial}
                      </p>
                      <p className="text-xs text-slate-500">{proveedor.tipo}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${estadoClass(proveedor.estado)}`}
                  >
                    {proveedor.estado}
                  </span>
                </div>
                {proveedor.estado === 'PENDIENTE' && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => aprobarMutation.mutate(proveedor.id)}
                    disabled={aprobarMutation.isPending}
                  >
                    Aprobar
                  </Button>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {query.data?.map((proveedor) => (
                  <tr key={proveedor.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-medium">{proveedor.nombreComercial}</td>
                    <td className="py-3 pr-3">{proveedor.tipo}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoClass(proveedor.estado)}`}
                      >
                        {proveedor.estado}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {proveedor.estado === 'PENDIENTE' && (
                        <Button
                          size="sm"
                          onClick={() => aprobarMutation.mutate(proveedor.id)}
                          disabled={aprobarMutation.isPending}
                        >
                          Aprobar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
