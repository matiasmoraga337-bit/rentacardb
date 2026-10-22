import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { crearConversacion } from '@/features/chat/api';
import { fechaFutura, formatearCLP, formatearFecha, formatearFechaHora } from '@/features/reservas/format';
import { FavoritoButton } from '@/features/favoritos/FavoritoButton';
import { fetchResenasProveedor, fetchResenasVehiculo } from '@/features/resenas/api';
import { fetchDisponibilidad, fetchVehiculo } from './api';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/catalogo" className="text-lg font-semibold text-brand">
            RentaCarDB
          </Link>
          <div className="flex items-center gap-3">
            <FavoritoButton vehiculoId={vehiculoId} />
            <Link
              to={usuario ? '/panel' : '/login'}
              className="text-sm text-slate-600 hover:text-brand"
            >
              {usuario ? 'Mi panel' : 'Iniciar sesion'}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Link to="/catalogo" className="text-sm text-brand hover:underline">
          Volver al catalogo
        </Link>

        {query.isLoading && <p className="text-slate-500">Cargando…</p>}
        {query.isError && <p className="text-sm text-red-600">Vehiculo no encontrado.</p>}

        {query.data && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">
                {query.data.marca} {query.data.modelo} · {query.data.anio}
              </h1>
              <p className="text-sm text-slate-600">
                {query.data.tipoVehiculo} · {query.data.combustible} · {query.data.transmision}
              </p>
              <p className="mt-1 text-xl font-semibold text-brand">
                ${query.data.precioDiario.toLocaleString('es-CL')} / dia
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {query.data.fotos.map((foto) => (
                <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer">
                  <img
                    src={foto.thumbUrl}
                    alt={`Foto ${foto.id}`}
                    className="h-28 w-full rounded-md border border-slate-200 object-cover"
                  />
                </a>
              ))}
              {query.data.fotos.length === 0 && (
                <p className="text-sm text-slate-500">Sin fotos.</p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reservar</CardTitle>
                <CardDescription>Elige las fechas para cotizar y continuar al checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>
                      {disponibilidad.data.disponible
                        ? 'Disponible en las fechas seleccionadas.'
                        : `No disponible${disponibilidad.data.motivo ? ` (${disponibilidad.data.motivo})` : ''}.`}
                    </p>
                    {disponibilidad.data.disponible && (
                      <p className="mt-1">
                        {disponibilidad.data.dias} dias · Total{' '}
                        <strong>{formatearCLP(disponibilidad.data.total)}</strong> (incluye
                        impuestos)
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {formatearFecha(fechaInicio)} → {formatearFecha(fechaFin)}
                    </p>
                  </div>
                )}

                {!usuario && (
                  <Link to="/login" state={{ from: checkoutUrl }}>
                    <Button disabled={!fechasValidas || !disponibilidad.data?.disponible}>
                      Inicia sesion para reservar
                    </Button>
                  </Link>
                )}
                {usuario && usuario.roles.includes('CLIENTE') && (
                  <Link to={checkoutUrl}>
                    <Button disabled={!fechasValidas || !disponibilidad.data?.disponible}>
                      Continuar al checkout
                    </Button>
                  </Link>
                )}
                {usuario && usuario.roles.includes('CLIENTE') && (
                  <Button
                    variant="outline"
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
                <CardTitle>Caracteristicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {query.data.caracteristicas.map((c) => (
                    <li key={c.id} className="rounded-full bg-slate-100 px-3 py-1">
                      {c.nombre}
                    </li>
                  ))}
                  {query.data.caracteristicas.length === 0 && (
                    <li className="text-slate-500">Sin caracteristicas informadas.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tarifas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {query.data.tarifas.map((t) => (
                    <li key={t.id}>
                      {t.nombre}: ${t.precioDia.toLocaleString('es-CL')} / dia ({t.fechaInicio} →{' '}
                      {t.fechaFin})
                    </li>
                  ))}
                  {query.data.tarifas.length === 0 && (
                    <li className="text-slate-500">Sin tarifas.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resenas del vehiculo</CardTitle>
                <CardDescription>
                  {resenas.isLoading && 'Cargando resenas…'}
                  {resenas.isError && 'No se pudieron cargar las resenas.'}
                  {resenas.data &&
                    (resenas.data.total > 0
                      ? `${resenas.data.promedio}/5 · ${resenas.data.total} ${
                          resenas.data.total === 1 ? 'resena' : 'resenas'
                        }`
                      : 'Sin resenas todavia.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {resenas.data?.resenas.map((resena) => (
                  <div key={resena.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium">{resena.calificacion}/5</p>
                    <p className="text-slate-600">{resena.comentario ?? 'Sin comentario.'}</p>
                    <p className="text-xs text-slate-500">
                      {resena.autor} · {formatearFechaHora(resena.fecha)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resenas del proveedor</CardTitle>
                <CardDescription>
                  {resenasProveedor.isLoading && 'Cargando resenas…'}
                  {resenasProveedor.isError && 'No se pudieron cargar las resenas.'}
                  {resenasProveedor.data &&
                    (resenasProveedor.data.total > 0
                      ? `${resenasProveedor.data.promedio}/5 · ${resenasProveedor.data.total} ${
                          resenasProveedor.data.total === 1 ? 'resena' : 'resenas'
                        }`
                      : 'Sin resenas todavia.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {resenasProveedor.data?.resenas.map((resena) => (
                  <div key={resena.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium">{resena.calificacion}/5</p>
                    <p className="text-slate-600">{resena.comentario ?? 'Sin comentario.'}</p>
                    <p className="text-xs text-slate-500">
                      {resena.autor} · {formatearFechaHora(resena.fecha)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
