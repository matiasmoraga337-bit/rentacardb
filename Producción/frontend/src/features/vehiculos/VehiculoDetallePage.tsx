import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCatalogo } from '@/features/catalogos/hooks';
import {
  agregarCaracteristica,
  crearTarifa,
  eliminarTarifa,
  fetchVehiculo,
  publicarVehiculo,
  quitarCaracteristica,
  subirFotos,
} from './api';

export function VehiculoDetallePage() {
  const { id } = useParams();
  const vehiculoId = Number(id);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['vehiculo', vehiculoId],
    queryFn: () => fetchVehiculo(vehiculoId),
    enabled: Number.isInteger(vehiculoId),
  });
  const caracteristicas = useCatalogo('caracteristicas');

  const [nombreTarifa, setNombreTarifa] = useState('Tarifa base');
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  const [precio, setPrecio] = useState(30000);
  const [error, setError] = useState('');

  const invalidar = (): void => {
    queryClient.invalidateQueries({ queryKey: ['vehiculo', vehiculoId] });
  };

  const fotosMutation = useMutation({
    mutationFn: (files: FileList) => subirFotos(vehiculoId, files),
    onSuccess: invalidar,
  });

  const publicarMutation = useMutation({
    mutationFn: () => publicarVehiculo(vehiculoId),
    onSuccess: invalidar,
  });

  const tarifaMutation = useMutation({
    mutationFn: () => crearTarifa(vehiculoId, { nombre: nombreTarifa, fechaInicio, fechaFin, precioDia: precio }),
    onSuccess: invalidar,
  });

  const eliminarTarifaMutation = useMutation({
    mutationFn: (tarifaId: number) => eliminarTarifa(vehiculoId, tarifaId),
    onSuccess: invalidar,
  });

  const caracteristicaMutation = useMutation({
    mutationFn: ({ idCar, activar }: { idCar: number; activar: boolean }) =>
      activar
        ? agregarCaracteristica(vehiculoId, idCar, true)
        : quitarCaracteristica(vehiculoId, idCar),
    onSuccess: invalidar,
  });

  if (query.isLoading) return <p className="text-slate-500">Cargando vehiculo…</p>;
  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">No se pudo cargar el vehiculo.</p>;
  }

  const vehiculo = query.data;
  const asignadas = new Set(vehiculo.caracteristicas.map((c) => c.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {vehiculo.marca} {vehiculo.modelo} · {vehiculo.patente}
          </h1>
          <p className="text-sm text-slate-600">
            {vehiculo.tipoVehiculo} · {vehiculo.combustible} · {vehiculo.transmision} ·{' '}
            {vehiculo.anio} · {vehiculo.kilometraje.toLocaleString('es-CL')} km
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{vehiculo.estadoPublicacion}</span>
          {vehiculo.estadoPublicacion !== 'PUBLICADO' && (
            <Button onClick={() => publicarMutation.mutate()} disabled={publicarMutation.isPending}>
              Publicar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
          <CardDescription>Se optimizan a WebP automaticamente (sin EXIF).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vehiculo.fotos.map((foto) => (
              <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer">
                <img
                  src={foto.thumbUrl}
                  alt={`Foto ${foto.id}`}
                  className="h-28 w-full rounded-md border border-slate-200 object-cover"
                />
              </a>
            ))}
            {vehiculo.fotos.length === 0 && (
              <p className="text-sm text-slate-500">Sin fotos todavia.</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="fotos">Subir fotos</Label>
            <Input
              id="fotos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(event) => {
                if (event.target.files?.length) fotosMutation.mutate(event.target.files);
              }}
            />
            {fotosMutation.isPending && <p className="text-sm text-slate-500">Optimizando…</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarifas</CardTitle>
          <CardDescription>Precio por dia para un rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-slate-100 text-sm">
            {vehiculo.tarifas.map((tarifa) => (
              <li key={tarifa.id} className="flex items-center justify-between py-2">
                <span>
                  {tarifa.nombre} · ${tarifa.precioDia.toLocaleString('es-CL')} ·{' '}
                  {tarifa.fechaInicio} → {tarifa.fechaFin}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarTarifaMutation.mutate(tarifa.id)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
            {vehiculo.tarifas.length === 0 && <li className="py-2 text-slate-500">Sin tarifas.</li>}
          </ul>

          <form
            className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError('');
              tarifaMutation.mutate(undefined, {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : 'No se pudo crear la tarifa.'),
              });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="tarifaNombre">Nombre</Label>
              <Input
                id="tarifaNombre"
                value={nombreTarifa}
                onChange={(e) => setNombreTarifa(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tarifaInicio">Desde</Label>
              <Input
                id="tarifaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tarifaFin">Hasta</Label>
              <Input
                id="tarifaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tarifaPrecio">Precio/dia</Label>
              <div className="flex gap-2">
                <Input
                  id="tarifaPrecio"
                  type="number"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                />
                <Button type="submit" disabled={tarifaMutation.isPending}>
                  Agregar
                </Button>
              </div>
            </div>
            {error && <p className="sm:col-span-4 text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caracteristicas</CardTitle>
          <CardDescription>Equipamiento disponible en el vehiculo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {caracteristicas.data?.map((car) => (
              <label key={car.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={asignadas.has(car.id)}
                  onChange={(event) =>
                    caracteristicaMutation.mutate({ idCar: car.id, activar: event.target.checked })
                  }
                />
                {car.nombre}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
