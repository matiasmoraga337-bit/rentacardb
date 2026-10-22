import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { fetchReserva } from '@/features/reservas/api';
import { formatearFecha } from '@/features/reservas/format';
import { fetchVehiculo } from '@/features/vehiculos/api';
import { iniciarArriendo } from './api';

export function IniciarArriendoPage() {
  const { reservaId } = useParams();
  const idReserva = Number(reservaId);
  const navigate = useNavigate();

  const reservaQuery = useQuery({
    queryKey: ['reserva', idReserva],
    queryFn: () => fetchReserva(idReserva),
    enabled: Number.isInteger(idReserva) && idReserva > 0,
  });
  const reserva = reservaQuery.data;

  const vehiculoQuery = useQuery({
    queryKey: ['vehiculo-publico', reserva?.vehiculoId],
    queryFn: () => fetchVehiculo(reserva!.vehiculoId),
    enabled: Boolean(reserva),
  });
  const vehiculo = vehiculoQuery.data;

  const [idSede, setIdSede] = useState<number | undefined>();
  const [kmInicial, setKmInicial] = useState<number>(0);
  const [combustible, setCombustible] = useState<number>(100);

  useEffect(() => {
    if (!reserva) return;
    if (idSede === undefined) setIdSede(reserva.idSedeRetiro);
  }, [reserva, idSede]);

  useEffect(() => {
    if (vehiculo) setKmInicial(vehiculo.kilometraje);
  }, [vehiculo]);

  const mutation = useMutation({
    mutationFn: () =>
      iniciarArriendo({
        ID_reserva: idReserva,
        ID_sede_retiro_real: idSede as number,
        kilometraje_inicial: kmInicial,
        combustible_inicial: combustible,
      }),
    onSuccess: (arriendo) => navigate(`/arriendos/${arriendo.id}`),
  });

  if (reservaQuery.isLoading || vehiculoQuery.isLoading) {
    return <p className="text-slate-500">Cargando reserva…</p>;
  }
  if (reservaQuery.isError || !reserva) {
    return <p className="text-sm text-red-600">No se pudo cargar la reserva.</p>;
  }
  if (vehiculoQuery.isError || !vehiculo) {
    return <p className="text-sm text-red-600">No se pudo cargar el vehiculo.</p>;
  }
  if (reserva.estado !== 'CONFIRMADA') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se puede iniciar el arriendo</CardTitle>
          <CardDescription>
            La reserva esta en estado {reserva.estado}; solo se puede iniciar desde CONFIRMADA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={`/reservas/${reserva.id}`}>
            <Button variant="outline">Volver a la reserva</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const sedes = vehiculo.sedes.filter((sede) => sede.permiteEntrega);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Iniciar arriendo</h1>
        <p className="text-sm text-slate-600">
          Reserva #{reserva.id} · {reserva.marca} {reserva.modelo} · {reserva.patente}
        </p>
        <p className="text-sm text-slate-600">
          Retiro pactado: {formatearFecha(reserva.fechaInicio)} · {reserva.sedeRetiro}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de entrega</CardTitle>
          <CardDescription>
            Registra el estado inicial del vehiculo al momento del retiro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="sedeEntrega">Sede de retiro real</Label>
            <Select
              id="sedeEntrega"
              value={idSede ?? ''}
              onChange={(event) => setIdSede(Number(event.target.value))}
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre} · {sede.comuna}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="kmInicial">Kilometraje inicial</Label>
              <Input
                id="kmInicial"
                type="number"
                min={0}
                value={kmInicial}
                onChange={(event) => setKmInicial(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="combustible">Combustible inicial (%)</Label>
              <Input
                id="combustible"
                type="number"
                min={0}
                max={100}
                value={combustible}
                onChange={(event) => setCombustible(Number(event.target.value))}
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'No se pudo iniciar el arriendo.'}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              disabled={mutation.isPending || !idSede}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Iniciando…' : 'Iniciar arriendo'}
            </Button>
            <Link to={`/reservas/${reserva.id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
