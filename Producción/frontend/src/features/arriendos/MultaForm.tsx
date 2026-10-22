import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarMulta } from './api';

const hoy = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

export function MultaForm({ idArriendo }: { idArriendo: number }) {
  const queryClient = useQueryClient();
  const [fecha, setFecha] = useState(hoy());
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<number | undefined>();
  const [organismo, setOrganismo] = useState('');
  const [numeroParte, setNumeroParte] = useState('');
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      registrarMulta(idArriendo, {
        fecha_multa: fecha,
        descripcion,
        monto: monto as number,
        organismo: organismo || undefined,
        numero_parte: numeroParte || undefined,
      }),
    onSuccess: () => {
      setMensaje('Multa registrada.');
      setDescripcion('');
      setMonto(undefined);
      setOrganismo('');
      setNumeroParte('');
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar multa</CardTitle>
        <CardDescription>
          Solo disponible para arriendos finalizados. Genera un movimiento MULTA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="multaFecha">Fecha de la multa</Label>
            <Input
              id="multaFecha"
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="multaMonto">Monto (CLP)</Label>
            <Input
              id="multaMonto"
              type="number"
              min={1}
              value={monto ?? ''}
              onChange={(event) =>
                setMonto(event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="multaParte">Numero de parte</Label>
            <Input
              id="multaParte"
              value={numeroParte}
              maxLength={50}
              onChange={(event) => setNumeroParte(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="multaDescripcion">Descripcion</Label>
            <Input
              id="multaDescripcion"
              value={descripcion}
              maxLength={500}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="multaOrganismo">Organismo</Label>
            <Input
              id="multaOrganismo"
              value={organismo}
              maxLength={150}
              onChange={(event) => setOrganismo(event.target.value)}
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'No se pudo registrar la multa.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          type="button"
          disabled={
            mutation.isPending || !fecha || !descripcion.trim() || !monto || monto <= 0
          }
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Registrando…' : 'Registrar multa'}
        </Button>
      </CardContent>
    </Card>
  );
}
