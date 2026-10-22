import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { registrarDano, type InspeccionArriendo } from './api';

export function DanosForm({
  idArriendo,
  inspeccion,
}: {
  idArriendo: number;
  inspeccion: InspeccionArriendo;
}) {
  const queryClient = useQueryClient();
  const [zona, setZona] = useState('PARACHOQUES_DELANTERO');
  const [tipo, setTipo] = useState('RAYON');
  const [severidad, setSeveridad] = useState<'LEVE' | 'MEDIO' | 'GRAVE'>('LEVE');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<number | undefined>();
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      registrarDano(idArriendo, inspeccion.id, {
        zona,
        tipo,
        severidad,
        descripcion: descripcion || undefined,
        monto_estimado: monto,
      }),
    onSuccess: () => {
      setMensaje('Dano registrado.');
      setDescripcion('');
      setMonto(undefined);
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar dano en la devolucion</CardTitle>
        <CardDescription>
          Inspeccion #{inspeccion.id} · {inspeccion.tipo}. Solo se registran danos en DEVOLUCION.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="zonaDano">Zona</Label>
            <Input id="zonaDano" value={zona} onChange={(event) => setZona(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tipoDano">Tipo</Label>
            <Input id="tipoDano" value={tipo} onChange={(event) => setTipo(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="severidadDano">Severidad</Label>
            <Select
              id="severidadDano"
              value={severidad}
              onChange={(event) =>
                setSeveridad(event.target.value as 'LEVE' | 'MEDIO' | 'GRAVE')
              }
            >
              <option value="LEVE">Leve</option>
              <option value="MEDIO">Medio</option>
              <option value="GRAVE">Grave</option>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="descripcionDano">Descripcion</Label>
            <Input
              id="descripcionDano"
              value={descripcion}
              maxLength={500}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="montoDano">Monto estimado (CLP)</Label>
            <Input
              id="montoDano"
              type="number"
              min={0}
              value={monto ?? ''}
              onChange={(event) =>
                setMonto(event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'No se pudo registrar.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Registrando…' : 'Registrar dano'}
        </Button>
      </CardContent>
    </Card>
  );
}
