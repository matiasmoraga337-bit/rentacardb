import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import { eliminarBusqueda, fetchBusquedas, type BusquedaGuardada } from './api';

function enlaceBusqueda(busqueda: BusquedaGuardada): string {
  const qs = new URLSearchParams();
  if (busqueda.fechaDesde) qs.set('desde', busqueda.fechaDesde);
  if (busqueda.fechaHasta) qs.set('hasta', busqueda.fechaHasta);
  if (busqueda.idComuna) qs.set('comuna', String(busqueda.idComuna));
  if (busqueda.idRegion) qs.set('region', String(busqueda.idRegion));
  if (busqueda.idTipoVehiculo) qs.set('tipo', String(busqueda.idTipoVehiculo));
  if (busqueda.precioMaximo) qs.set('precio', String(busqueda.precioMaximo));
  return `/catalogo?${qs.toString()}`;
}

export function BusquedasPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['busquedas'], queryFn: fetchBusquedas });
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => eliminarBusqueda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['busquedas'] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Busquedas guardadas</h1>
        <p className="text-sm text-slate-600">Vuelve a aplicar tus filtros favoritos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis busquedas</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.length} busqueda(s).` : 'Cargando…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudieron cargar las busquedas.</p>}
          {query.data?.length === 0 && (
            <p className="text-sm text-slate-500">Aun no tienes busquedas guardadas.</p>
          )}
          {query.data?.map((busqueda) => (
            <div
              key={busqueda.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div>
                <p className="font-medium">{busqueda.nombre ?? `Busqueda #${busqueda.id}`}</p>
                <p className="text-slate-500">
                  {busqueda.fechaDesde && busqueda.fechaHasta
                    ? `${formatearFecha(busqueda.fechaDesde)} → ${formatearFecha(busqueda.fechaHasta)}`
                    : 'Sin fechas'}
                  {busqueda.precioMaximo ? ` · hasta ${formatearCLP(busqueda.precioMaximo)}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={enlaceBusqueda(busqueda)}>
                  <Button size="sm" variant="outline">
                    Aplicar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={eliminarMutation.isPending}
                  onClick={() => eliminarMutation.mutate(busqueda.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
