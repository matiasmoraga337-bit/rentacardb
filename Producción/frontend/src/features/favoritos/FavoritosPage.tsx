import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { assetUrl } from '@/lib/api';
import { formatearCLP } from '@/features/reservas/format';
import { fetchFavoritos, quitarFavorito } from './api';

export function FavoritosPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['favoritos'], queryFn: fetchFavoritos });
  const quitarMutation = useMutation({
    mutationFn: (id: number) => quitarFavorito(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoritos'] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-sm text-slate-600">Vehiculos que guardaste para revisar despues.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis vehiculos favoritos</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.length} vehiculo(s).` : 'Cargando…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudieron cargar los favoritos.</p>}
          {query.data?.length === 0 && (
            <p className="text-sm text-slate-500">Aun no tienes favoritos.</p>
          )}
          {query.data?.map((favorito) => (
            <div
              key={favorito.vehiculoId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                {favorito.fotoUrl ? (
                  <img
                    src={assetUrl(favorito.fotoUrl) ?? favorito.fotoUrl}
                    alt={favorito.patente}
                    className="h-16 w-24 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                    Sin foto
                  </div>
                )}
                <div>
                  <Link
                    to={`/catalogo/${favorito.vehiculoId}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {favorito.marca} {favorito.modelo} · {favorito.anio}
                  </Link>
                  <p className="text-slate-500">
                    {favorito.patente} · {favorito.comuna ?? 'Sin comuna'} · {favorito.proveedor}
                  </p>
                  <p className="text-slate-600">{formatearCLP(favorito.precioDiario)} / dia</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={quitarMutation.isPending}
                onClick={() => quitarMutation.mutate(favorito.vehiculoId)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
