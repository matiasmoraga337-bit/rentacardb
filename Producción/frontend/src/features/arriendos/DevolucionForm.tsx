import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { fetchVehiculo } from '@/features/vehiculos/api';
import { registrarDevolucion, type Arriendo } from './api';

export function DevolucionForm({ arriendo }: { arriendo: Arriendo }) {
  const queryClient = useQueryClient();
  const vehiculoQuery = useQuery({
    queryKey: ['vehiculo-publico', arriendo.vehiculoId],
    queryFn: () => fetchVehiculo(arriendo.vehiculoId),
  });
  const [idSede, setIdSede] = useState<number | undefined>(
    arriendo.idSedeDevolucion ?? arriendo.idSedeRetiro,
  );
  const [kmFinal, setKmFinal] = useState<number>(arriendo.kmInicial);
  const [combustible, setCombustible] = useState<number>(arriendo.combustibleInicial);
  const [limpieza, setLimpieza] = useState<'BUENA' | 'REGULAR' | 'MALA'>('BUENA');
  const [observaciones, setObservaciones] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (idSede === undefined) setIdSede(arriendo.idSedeDevolucion ?? arriendo.idSedeRetiro);
  }, [arriendo, idSede]);

  const mutation = useMutation({
    mutationFn: () =>
      registrarDevolucion(arriendo.id, {
        ID_sede_devolucion_real: idSede as number,
        kilometraje_final: kmFinal,
        combustible_final: combustible,
        limpieza,
        observaciones: observaciones || undefined,
      }),
    onSuccess: () => {
      setMensaje('Devolucion registrada. El arriendo quedo finalizado.');
      queryClient.invalidateQueries({ queryKey: ['arriendo', arriendo.id] });
      queryClient.invalidateQueries({ queryKey: ['arriendos'] });
    },
  });

  const sedes = vehiculoQuery.data?.sedes.filter((sede) => sede.permiteDevolucion) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar devolucion</CardTitle>
        <CardDescription>
          Al finalizar se calcula el cargo por km excedido si la reserva tiene politica de km.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="sedeDevolucion">Sede de devolucion real</Label>
          <Select
            id="sedeDevolucion"
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
            <Label htmlFor="kmFinal">Kilometraje final</Label>
            <Input
              id="kmFinal"
              type="number"
              min={arriendo.kmInicial}
              value={kmFinal}
              onChange={(event) => setKmFinal(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="combustibleFinal">Combustible final (%)</Label>
            <Input
              id="combustibleFinal"
              type="number"
              min={0}
              max={100}
              value={combustible}
              onChange={(event) => setCombustible(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="limpieza">Limpieza</Label>
            <Select
              id="limpieza"
              value={limpieza}
              onChange={(event) =>
                setLimpieza(event.target.value as 'BUENA' | 'REGULAR' | 'MALA')
              }
            >
              <option value="BUENA">Buena</option>
              <option value="REGULAR">Regular</option>
              <option value="MALA">Mala</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="observacionesDevolucion">Observaciones</Label>
            <Input
              id="observacionesDevolucion"
              value={observaciones}
              maxLength={1000}
              onChange={(event) => setObservaciones(event.target.value)}
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'No se pudo registrar la devolucion.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          disabled={mutation.isPending || !idSede || Boolean(mensaje)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Registrando…' : 'Registrar devolucion'}
        </Button>
      </CardContent>
    </Card>
  );
}
