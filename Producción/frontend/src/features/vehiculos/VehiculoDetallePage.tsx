import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';
import { formatearCLP, formatearFecha } from '@/features/reservas/format';
import {
  agregarCaracteristica,
  crearTarifa,
  eliminarTarifa,
  fetchMantenimientos,
  fetchVehiculo,
  finalizarMantenimiento,
  publicarVehiculo,
  registrarMantenimiento,
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
  const tiposMantenimiento = useCatalogo('tipos-mantenimiento');
  const mantenimientos = useQuery({
    queryKey: ['mantenimientos', vehiculoId],
    queryFn: () => fetchMantenimientos(vehiculoId),
    enabled: Number.isInteger(vehiculoId),
  });

  const [nombreTarifa, setNombreTarifa] = useState('Tarifa base');
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  const [precio, setPrecio] = useState(30000);
  const [error, setError] = useState('');
  const [idTipoMantenimiento, setIdTipoMantenimiento] = useState<number | undefined>();
  const [kmMantenimiento, setKmMantenimiento] = useState<number | undefined>();
  const [tallerMantenimiento, setTallerMantenimiento] = useState('');
  const [descripcionMantenimiento, setDescripcionMantenimiento] = useState('');
  const [costoMantenimiento, setCostoMantenimiento] = useState<number | undefined>();
  const [costoFinal, setCostoFinal] = useState<number | undefined>();
  const [errorMantenimiento, setErrorMantenimiento] = useState('');

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

  const invalidarMantenimientos = (): void => {
    queryClient.invalidateQueries({ queryKey: ['mantenimientos', vehiculoId] });
    queryClient.invalidateQueries({ queryKey: ['panel-proveedor-vehiculos'] });
    invalidar();
  };

  const registrarMantenimientoMutation = useMutation({
    mutationFn: () =>
      registrarMantenimiento(vehiculoId, {
        ID_tipo_mantenimiento: idTipoMantenimiento as number,
        kilometraje: kmMantenimiento ?? query.data!.kilometraje,
        descripcion: descripcionMantenimiento || undefined,
        taller: tallerMantenimiento || undefined,
        costo: costoMantenimiento,
      }),
    onSuccess: () => {
      setErrorMantenimiento('');
      setDescripcionMantenimiento('');
      setTallerMantenimiento('');
      setCostoMantenimiento(undefined);
      invalidarMantenimientos();
    },
    onError: (err) =>
      setErrorMantenimiento(
        err instanceof Error ? err.message : 'No se pudo registrar el mantenimiento.',
      ),
  });

  const finalizarMantenimientoMutation = useMutation({
    mutationFn: (idMantenimiento: number) =>
      finalizarMantenimiento(vehiculoId, idMantenimiento, costoFinal),
    onSuccess: () => {
      setErrorMantenimiento('');
      setCostoFinal(undefined);
      invalidarMantenimientos();
    },
    onError: (err) =>
      setErrorMantenimiento(
        err instanceof Error ? err.message : 'No se pudo finalizar el mantenimiento.',
      ),
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
          <CardTitle>Mantenimiento</CardTitle>
          <CardDescription>
            Mantenimiento activo e historial del vehiculo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mantenimientos.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {mantenimientos.isError && (
            <p className="text-sm text-red-600">No se pudo cargar el mantenimiento.</p>
          )}

          {mantenimientos.data?.activos.length === 0 && vehiculo.estadoVehiculo === 'ARRENDADO' && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              El vehiculo esta arrendado; no se puede iniciar mantenimiento.
            </p>
          )}

          {mantenimientos.data?.activos.map((mantenimiento) => (
            <div
              key={mantenimiento.id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              <p className="font-medium">
                {mantenimiento.tipo} · desde {formatearFecha(mantenimiento.fechaInicio)}
              </p>
              <p className="mt-1 text-slate-600">
                {mantenimiento.taller || 'Sin taller'} ·{' '}
                {mantenimiento.costo !== null
                  ? formatearCLP(mantenimiento.costo)
                  : 'Costo pendiente'}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`costoFinal-${mantenimiento.id}`}>Costo final</Label>
                  <Input
                    id={`costoFinal-${mantenimiento.id}`}
                    type="number"
                    min={0}
                    placeholder="Opcional"
                    value={costoFinal ?? ''}
                    onChange={(event) =>
                      setCostoFinal(event.target.value ? Number(event.target.value) : undefined)
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => finalizarMantenimientoMutation.mutate(mantenimiento.id)}
                  disabled={finalizarMantenimientoMutation.isPending}
                >
                  Finalizar mantenimiento
                </Button>
              </div>
            </div>
          ))}

          {mantenimientos.data?.activos.length === 0 && vehiculo.estadoVehiculo !== 'ARRENDADO' && (
            <form
              className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setErrorMantenimiento('');
                if (!idTipoMantenimiento) {
                  setErrorMantenimiento('Selecciona un tipo de mantenimiento.');
                  return;
                }
                registrarMantenimientoMutation.mutate();
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="tipoMantenimiento">Tipo</Label>
                <Select
                  id="tipoMantenimiento"
                  value={idTipoMantenimiento ?? ''}
                  onChange={(event) =>
                    setIdTipoMantenimiento(
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposMantenimiento.data?.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="kmMantenimiento">Kilometraje</Label>
                <Input
                  id="kmMantenimiento"
                  type="number"
                  min={0}
                  value={kmMantenimiento ?? vehiculo.kilometraje}
                  onChange={(event) =>
                    setKmMantenimiento(event.target.value ? Number(event.target.value) : undefined)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tallerMantenimiento">Taller</Label>
                <Input
                  id="tallerMantenimiento"
                  value={tallerMantenimiento}
                  onChange={(event) => setTallerMantenimiento(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="costoMantenimiento">Costo estimado</Label>
                <Input
                  id="costoMantenimiento"
                  type="number"
                  min={0}
                  value={costoMantenimiento ?? ''}
                  onChange={(event) =>
                    setCostoMantenimiento(
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="descripcionMantenimiento">Descripcion</Label>
                <Input
                  id="descripcionMantenimiento"
                  value={descripcionMantenimiento}
                  onChange={(event) => setDescripcionMantenimiento(event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={registrarMantenimientoMutation.isPending}>
                  Registrar mantenimiento
                </Button>
              </div>
            </form>
          )}

          {errorMantenimiento && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{errorMantenimiento}</p>
          )}

          {mantenimientos.data && mantenimientos.data.historial.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Historial</p>
              <ul className="divide-y divide-slate-100 text-sm">
                {mantenimientos.data.historial.map((mantenimiento) => (
                  <li key={mantenimiento.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      {mantenimiento.tipo} · {formatearFecha(mantenimiento.fechaInicio)}
                      {mantenimiento.fechaFin
                        ? ` → ${formatearFecha(mantenimiento.fechaFin)}`
                        : ' · activo'}
                    </span>
                    <span className="text-slate-500">
                      {mantenimiento.costo !== null
                        ? formatearCLP(mantenimiento.costo)
                        : 'Sin costo'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
