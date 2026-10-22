import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { fetchDisponibilidad, fetchVehiculo } from '@/features/vehiculos/api';
import { crearReserva, nuevaIdempotencyKey } from './api';
import { fechaFutura, formatearCLP, formatearFecha } from './format';
import { CARGO_KM_EXCEDIDO, KM_INCLUIDOS_DIA } from './kmPolicy';

export function CheckoutPage() {
  const { vehiculoId } = useParams();
  const id = Number(vehiculoId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fechaInicio, setFechaInicio] = useState(
    searchParams.get('desde') || fechaFutura(7),
  );
  const [fechaFin, setFechaFin] = useState(searchParams.get('hasta') || fechaFutura(11));
  const [idRetiro, setIdRetiro] = useState<number | undefined>(
    searchParams.get('retiro') ? Number(searchParams.get('retiro')) : undefined,
  );
  const [idDevolucion, setIdDevolucion] = useState<number | undefined>(
    searchParams.get('devolucion') ? Number(searchParams.get('devolucion')) : undefined,
  );
  const [observaciones, setObservaciones] = useState('');
  const [idempotencyKey] = useState(() => nuevaIdempotencyKey());

  const vehiculoQuery = useQuery({
    queryKey: ['vehiculo-publico', id],
    queryFn: () => fetchVehiculo(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  const vehiculo = vehiculoQuery.data;

  useEffect(() => {
    if (!vehiculo) return;
    const entrega = vehiculo.sedes.filter((sede) => sede.permiteEntrega);
    const devolucion = vehiculo.sedes.filter((sede) => sede.permiteDevolucion);
    const retiroPreferido = entrega.find((sede) => sede.id === vehiculo.idSedeActual) ?? entrega[0];
    const devolucionPreferida =
      devolucion.find((sede) => sede.id === vehiculo.idSedeActual) ?? devolucion[0];
    if (idRetiro === undefined && retiroPreferido) setIdRetiro(retiroPreferido.id);
    if (idDevolucion === undefined && devolucionPreferida) setIdDevolucion(devolucionPreferida.id);
  }, [vehiculo, idRetiro, idDevolucion]);

  const fechasValidas = Boolean(fechaInicio && fechaFin && fechaFin > fechaInicio);

  const disponibilidadQuery = useQuery({
    queryKey: ['disponibilidad', id, fechaInicio, fechaFin],
    queryFn: () => fetchDisponibilidad(id, fechaInicio, fechaFin),
    enabled: Boolean(vehiculo) && fechasValidas,
    retry: false,
  });

  const sedesEntrega = useMemo(
    () => vehiculo?.sedes.filter((sede) => sede.permiteEntrega) ?? [],
    [vehiculo],
  );
  const sedesDevolucion = useMemo(
    () => vehiculo?.sedes.filter((sede) => sede.permiteDevolucion) ?? [],
    [vehiculo],
  );

  const mutation = useMutation({
    mutationFn: () =>
      crearReserva(
        {
          ID_vehiculo: id,
          ID_sede_retiro: idRetiro as number,
          ID_sede_devolucion: idDevolucion as number,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          observaciones: observaciones || undefined,
          politica_combustible: 'MISMO_NIVEL',
        },
        idempotencyKey,
      ),
    onSuccess: (reserva) => navigate(`/reservas/${reserva.id}/pagar`),
  });

  if (vehiculoQuery.isLoading) return <p className="text-slate-500">Cargando vehiculo…</p>;
  if (vehiculoQuery.isError || !vehiculo) {
    return <p className="text-sm text-red-600">No se pudo cargar el vehiculo.</p>;
  }

  const disponible = disponibilidadQuery.data?.disponible ?? false;
  const puedeConfirmar =
    disponible && Boolean(idRetiro) && Boolean(idDevolucion) && fechasValidas && !mutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Confirmar reserva</h1>
        <p className="text-sm text-slate-600">
          {vehiculo.marca} {vehiculo.modelo} · {vehiculo.patente}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fechas y sedes</CardTitle>
            <CardDescription>Selecciona cuando y donde retiras el vehiculo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="checkoutDesde">Desde</Label>
                <Input
                  id="checkoutDesde"
                  type="date"
                  value={fechaInicio}
                  onChange={(event) => setFechaInicio(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkoutHasta">Hasta</Label>
                <Input
                  id="checkoutHasta"
                  type="date"
                  value={fechaFin}
                  onChange={(event) => setFechaFin(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sedeRetiro">Sede de retiro</Label>
              <Select
                id="sedeRetiro"
                value={idRetiro ?? ''}
                onChange={(event) => setIdRetiro(Number(event.target.value))}
              >
                <option value="">Selecciona una sede</option>
                {sedesEntrega.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre} · {sede.comuna}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sedeDevolucion">Sede de devolucion</Label>
              <Select
                id="sedeDevolucion"
                value={idDevolucion ?? ''}
                onChange={(event) => setIdDevolucion(Number(event.target.value))}
              >
                <option value="">Selecciona una sede</option>
                {sedesDevolucion.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre} · {sede.comuna}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Input
                id="observaciones"
                value={observaciones}
                maxLength={500}
                onChange={(event) => setObservaciones(event.target.value)}
              />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">Politica de kilometraje</p>
              <p>
                Incluye {KM_INCLUIDOS_DIA} km por dia. El excedente se cobra a{' '}
                {formatearCLP(CARGO_KM_EXCEDIDO)} por km al registrar la devolucion.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>El total incluye impuestos y deposito si corresponde.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!fechasValidas && <p className="text-amber-700">Revisa el rango de fechas.</p>}
            {disponibilidadQuery.isLoading && (
              <p className="text-slate-500">Calculando disponibilidad…</p>
            )}
            {disponibilidadQuery.isError && (
              <p className="text-sm text-red-600">
                {disponibilidadQuery.error instanceof Error
                  ? disponibilidadQuery.error.message
                  : 'No se pudo calcular la disponibilidad.'}
              </p>
            )}
            {disponibilidadQuery.data && !disponibilidadQuery.data.disponible && (
              <p className="text-red-600">
                Vehiculo no disponible en esas fechas
                {disponibilidadQuery.data.motivo ? ` (${disponibilidadQuery.data.motivo})` : ''}.
              </p>
            )}
            {disponibilidadQuery.data && (
              <>
                <div className="flex justify-between">
                  <span>Dias</span>
                  <span>{disponibilidadQuery.data.dias}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio por dia</span>
                  <span>{formatearCLP(disponibilidadQuery.data.precioDia)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatearCLP(disponibilidadQuery.data.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto ({disponibilidadQuery.data.ivaPorcentaje}%)</span>
                  <span>{formatearCLP(disponibilidadQuery.data.impuesto)}</span>
                </div>
                {disponibilidadQuery.data.deposito > 0 && (
                  <div className="flex justify-between">
                    <span>Deposito</span>
                    <span>{formatearCLP(disponibilidadQuery.data.deposito)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatearCLP(disponibilidadQuery.data.total)}</span>
                </div>
              </>
            )}
            <p className="text-xs text-slate-500">
              Retiro {formatearFecha(fechaInicio)} · Devolucion {formatearFecha(fechaFin)}.
            </p>

            {mutation.isError && (
              <p className="rounded-md bg-red-50 p-2 text-red-700">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : 'No se pudo crear la reserva.'}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button disabled={!puedeConfirmar} onClick={() => mutation.mutate()}>
                {mutation.isPending ? 'Creando reserva…' : 'Crear reserva'}
              </Button>
              <Link to={`/catalogo/${vehiculo.id}`}>
                <Button variant="outline">Volver</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
