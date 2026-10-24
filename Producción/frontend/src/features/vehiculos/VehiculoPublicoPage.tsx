import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RatingStars, formatRating } from '@/components/ui/rating-stars';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthContext';
import { crearConversacion } from '@/features/chat/api';
import { fechaFutura, formatearCLP, formatearFecha } from '@/features/reservas/format';
import { FavoritoButton } from '@/features/favoritos/FavoritoButton';
import { fetchResenasProveedor, fetchResenasVehiculo } from '@/features/resenas/api';
import { fetchDisponibilidad, fetchVehiculo } from './api';
import { ResenasCard } from './ResenasCard';
import { VehiculoGaleria } from './VehiculoGaleria';
import { cn } from '@/lib/utils';

export function VehiculoPublicoPage() {
  const { id } = useParams();
  const vehiculoId = Number(id);
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState(
    searchParams.get('desde') || fechaFutura(7),
  );
  const [fechaFin, setFechaFin] = useState(searchParams.get('hasta') || fechaFutura(11));

  const query = useQuery({
    queryKey: ['vehiculo-publico', vehiculoId],
    queryFn: () => fetchVehiculo(vehiculoId),
    enabled: Number.isInteger(vehiculoId),
  });

  const fechasValidas = Boolean(fechaInicio && fechaFin && fechaFin > fechaInicio);
  const disponibilidad = useQuery({
    queryKey: ['disponibilidad', vehiculoId, fechaInicio, fechaFin],
    queryFn: () => fetchDisponibilidad(vehiculoId, fechaInicio, fechaFin),
    enabled: Boolean(query.data) && fechasValidas,
    retry: false,
  });

  const resenas = useQuery({
    queryKey: ['vehiculo-resenas', vehiculoId],
    queryFn: () => fetchResenasVehiculo(vehiculoId),
    enabled: Number.isInteger(vehiculoId),
  });

  const resenasProveedor = useQuery({
    queryKey: ['proveedor-resenas', query.data?.idProveedor],
    queryFn: () => fetchResenasProveedor(query.data!.idProveedor),
    enabled: Boolean(query.data),
  });

  const contactoMutation = useMutation({
    mutationFn: () =>
      crearConversacion({
        ID_proveedor: query.data!.idProveedor,
        ID_vehiculo: vehiculoId,
      }),
    onSuccess: (conversacion) => navigate(`/chat/${conversacion.id}`),
  });

  const checkoutUrl = `/checkout/${vehiculoId}?desde=${fechaInicio}&hasta=${fechaFin}`;
  const puedeReservar = Boolean(fechasValidas && disponibilidad.data?.disponible);
  const ctaClass = cn(
    buttonVariants({ size: 'lg' }),
    'w-full',
    !puedeReservar && 'pointer-events-none opacity-50',
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Link to="/catalogo" className="text-sm text-brand hover:underline">
          Volver al catálogo
        </Link>

        {query.isLoading && (
          <div className="space-y-4" role="status" aria-label="Cargando vehículo">
            <span className="sr-only">Cargando vehículo…</span>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="aspect-[16/9] max-h-[480px] w-full rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        )}
        {query.isError && <p className="text-sm text-red-600">Vehículo no encontrado.</p>}

        {query.data && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  {query.data.tipoVehiculo}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {query.data.marca} {query.data.modelo}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {query.data.anio} · {query.data.combustible} · {query.data.transmision} ·{' '}
                  {query.data.kilometraje.toLocaleString('es-CL')} km
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-2xl font-bold tracking-tight text-brand">
                    {formatearCLP(query.data.precioDiario)}
                    <span className="ml-1 text-sm font-normal text-slate-500">/ día</span>
                  </p>
                  {resenas.data && resenas.data.total > 0 && resenas.data.promedio !== null && (
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <RatingStars
                        value={resenas.data.promedio}
                        label={`Calificación promedio: ${formatRating(resenas.data.promedio)} de 5`}
                      />
                      {formatRating(resenas.data.promedio)} · {resenas.data.total}{' '}
                      {resenas.data.total === 1 ? 'reseña' : 'reseñas'}
                    </span>
                  )}
                </div>
              </div>
              <FavoritoButton vehiculoId={vehiculoId} />
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)] lg:items-start">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <VehiculoGaleria vehiculo={query.data} />
              </div>

              <aside className="space-y-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <Card className="border-brand/20 shadow-md">
                  <CardHeader>
                    <CardTitle>Reservar</CardTitle>
                    <CardDescription>
                      Elige las fechas para cotizar y continuar al checkout.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="detalleDesde">Desde</Label>
                        <Input
                          id="detalleDesde"
                          type="date"
                          value={fechaInicio}
                          onChange={(event) => setFechaInicio(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="detalleHasta">Hasta</Label>
                        <Input
                          id="detalleHasta"
                          type="date"
                          value={fechaFin}
                          onChange={(event) => setFechaFin(event.target.value)}
                        />
                      </div>
                    </div>

                    {!fechasValidas && (
                      <p className="text-sm text-amber-700">Revisa el rango de fechas.</p>
                    )}
                    {disponibilidad.isLoading && (
                      <p className="text-sm text-slate-500">Calculando disponibilidad…</p>
                    )}
                    {disponibilidad.isError && (
                      <p className="text-sm text-red-600">
                        {disponibilidad.error instanceof Error
                          ? disponibilidad.error.message
                          : 'No se pudo calcular la disponibilidad.'}
                      </p>
                    )}
                    {disponibilidad.data && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-medium">
                          {disponibilidad.data.disponible
                            ? 'Disponible en las fechas seleccionadas'
                            : `No disponible${
                                disponibilidad.data.motivo
                                  ? ` (${disponibilidad.data.motivo})`
                                  : ''
                              }`}
                        </p>
                        {disponibilidad.data.disponible && (
                          <p className="mt-1 text-slate-600">
                            {disponibilidad.data.dias}{' '}
                            {disponibilidad.data.dias === 1 ? 'día' : 'días'} · Total{' '}
                            <strong className="text-brand">
                              {formatearCLP(disponibilidad.data.total)}
                            </strong>{' '}
                            <span className="text-xs">(incluye impuestos)</span>
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatearFecha(fechaInicio)} → {formatearFecha(fechaFin)}
                        </p>
                      </div>
                    )}

                    {!usuario && (
                      <Link
                        to="/login"
                        state={{ from: checkoutUrl }}
                        className={ctaClass}
                        aria-disabled={!puedeReservar}
                      >
                        Inicia sesión para reservar
                      </Link>
                    )}
                    {usuario && usuario.roles.includes('CLIENTE') && (
                      <Link
                        to={checkoutUrl}
                        className={ctaClass}
                        aria-disabled={!puedeReservar}
                      >
                        Continuar al checkout
                      </Link>
                    )}
                    {usuario && usuario.roles.includes('CLIENTE') && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={contactoMutation.isPending}
                        onClick={() => contactoMutation.mutate()}
                      >
                        {contactoMutation.isPending ? 'Abriendo chat…' : 'Contactar proveedor'}
                      </Button>
                    )}
                    {contactoMutation.isError && (
                      <p className="text-sm text-red-600">
                        {contactoMutation.error instanceof Error
                          ? contactoMutation.error.message
                          : 'No se pudo abrir el chat.'}
                      </p>
                    )}
                    {usuario && !usuario.roles.includes('CLIENTE') && (
                      <p className="text-sm text-slate-600">
                        Tu cuenta no tiene rol CLIENTE; no puedes crear reservas.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-brand" aria-hidden="true" />
                      Retiro y devolución
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {query.data.sedes.map((sede) => (
                      <div key={sede.id} className="space-y-1">
                        <p className="font-medium">{sede.nombre}</p>
                        <p className="text-slate-600">
                          {sede.direccion}, {sede.comuna}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sede.permiteEntrega ? 'Entrega disponible' : 'Sin entrega'} ·{' '}
                          {sede.permiteDevolucion ? 'Devolución disponible' : 'Sin devolución'}
                        </p>
                      </div>
                    ))}
                    {query.data.sedes.length === 0 && (
                      <p className="text-slate-500">Sin sede informada.</p>
                    )}
                  </CardContent>
                </Card>
              </aside>

              <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Ficha del vehículo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-slate-500">Año</dt>
                        <dd className="mt-0.5 font-medium">{query.data.anio}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Kilometraje</dt>
                        <dd className="mt-0.5 font-medium">
                          {query.data.kilometraje.toLocaleString('es-CL')} km
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Patente</dt>
                        <dd className="mt-0.5 font-mono text-xs font-medium">
                          {query.data.patente}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Tipo</dt>
                        <dd className="mt-0.5 font-medium">{query.data.tipoVehiculo}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Combustible</dt>
                        <dd className="mt-0.5 font-medium">{query.data.combustible}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Transmisión</dt>
                        <dd className="mt-0.5 font-medium">{query.data.transmision}</dd>
                      </div>
                    </dl>

                    <div>
                      <p className="text-sm font-medium">Características</p>
                      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                        {query.data.caracteristicas
                          .filter((caracteristica) => caracteristica.disponible)
                          .map((caracteristica) => (
                            <li
                              key={caracteristica.id}
                              className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
                            >
                              {caracteristica.nombre}
                            </li>
                          ))}
                        {query.data.caracteristicas.every(
                          (caracteristica) => !caracteristica.disponible,
                        ) && <li className="text-slate-500">Sin características informadas.</li>}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tarifas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {query.data.tarifas
                        .filter((tarifa) => tarifa.activa)
                        .map((tarifa) => (
                          <li
                            key={tarifa.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                          >
                            <span>{tarifa.nombre}</span>
                            <span className="font-medium text-brand">
                              {formatearCLP(tarifa.precioDia)} / día
                            </span>
                            <span className="w-full text-xs text-slate-500">
                              {formatearFecha(tarifa.fechaInicio)} →{' '}
                              {formatearFecha(tarifa.fechaFin)}
                            </span>
                          </li>
                        ))}
                      {query.data.tarifas.every((tarifa) => !tarifa.activa) && (
                        <li className="text-slate-500">Sin tarifas vigentes.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <ResenasCard
                  title="Reseñas del vehículo"
                  data={resenas.data}
                  isLoading={resenas.isLoading}
                  isError={resenas.isError}
                />
                <ResenasCard
                  title="Reseñas del proveedor"
                  data={resenasProveedor.data}
                  isLoading={resenasProveedor.isLoading}
                  isError={resenasProveedor.isError}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
