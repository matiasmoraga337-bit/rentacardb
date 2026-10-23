import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { formatearCLP } from '@/features/reservas/format';
import { fetchMisVehiculos } from './api';

export function MisVehiculosPage() {
  const query = useQuery({ queryKey: ['mis-vehiculos'], queryFn: fetchMisVehiculos });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mis vehículos</h1>
          <p className="text-sm text-slate-600">Flota asociada a tu proveedor.</p>
        </div>
        <Link to="/proveedor/vehiculos/nuevo">
          <Button>Nuevo vehículo</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flota</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.length} vehículo(s) registrados.` : 'Cargando vehículos.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <TableSkeleton />}
          {query.isError && (
            <p className="text-sm text-red-600">
              No se pudieron cargar los vehículos. ¿Registraste tu proveedor?
            </p>
          )}
          {query.data?.length === 0 && (
            <p className="text-sm text-slate-500">Aún no tienes vehículos.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {query.data?.map((vehiculo) => (
              <Link
                key={vehiculo.id}
                to={`/proveedor/vehiculos/${vehiculo.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {vehiculo.anio} · <span className="font-mono">{vehiculo.patente}</span>
                    </p>
                  </div>
                  <span
                    className={
                      vehiculo.estadoPublicacion === 'PUBLICADO'
                        ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800'
                        : 'rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600'
                    }
                  >
                    {vehiculo.estadoPublicacion}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Precio / día</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {formatearCLP(vehiculo.precioDiario)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Fotos</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{vehiculo.fotos}</dd>
                  </div>
                </dl>
                <span className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-medium text-brand">
                  Administrar
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Patente</th>
                  <th className="py-2 pr-3">Vehículo</th>
                  <th className="py-2 pr-3">Precio/día</th>
                  <th className="py-2 pr-3">Publicación</th>
                  <th className="py-2 pr-3">Fotos</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {query.data?.map((vehiculo) => (
                  <tr key={vehiculo.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-xs font-medium">{vehiculo.patente}</td>
                    <td className="py-2 pr-3">
                      {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                    </td>
                    <td className="py-2 pr-3">{formatearCLP(vehiculo.precioDiario)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          vehiculo.estadoPublicacion === 'PUBLICADO'
                            ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                        }
                      >
                        {vehiculo.estadoPublicacion}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{vehiculo.fotos}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/proveedor/vehiculos/${vehiculo.id}`}
                        className="text-brand hover:underline"
                      >
                        Administrar
                      </Link>
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
