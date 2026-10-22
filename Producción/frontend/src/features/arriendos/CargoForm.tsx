import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { registrarCargoExtra } from './api';

const TIPOS = [
  { valor: 'COMBUSTIBLE', etiqueta: 'Combustible' },
  { valor: 'KM_EXCEDIDO', etiqueta: 'Km excedido' },
  { valor: 'DANO', etiqueta: 'Dano' },
  { valor: 'LIMPIEZA', etiqueta: 'Limpieza' },
  { valor: 'MULTA_TRANSITO', etiqueta: 'Multa de transito' },
  { valor: 'OTRO', etiqueta: 'Otro' },
] as const;

type TipoCargo = (typeof TIPOS)[number]['valor'];

export function CargoForm({ idArriendo }: { idArriendo: number }) {
  const queryClient = useQueryClient();
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState<number | undefined>();
  const [tipo, setTipo] = useState<TipoCargo>('OTRO');
  const [observaciones, setObservaciones] = useState('');
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      registrarCargoExtra(idArriendo, {
        concepto,
        monto: monto as number,
        tipo_cargo: tipo,
        observaciones: observaciones || undefined,
      }),
    onSuccess: () => {
      setMensaje('Cargo registrado.');
      setConcepto('');
      setMonto(undefined);
      setObservaciones('');
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar cargo extra</CardTitle>
        <CardDescription>
          Solo disponible para arriendos finalizados. Genera un movimiento financiero.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cargoConcepto">Concepto</Label>
            <Input
              id="cargoConcepto"
              value={concepto}
              maxLength={200}
              onChange={(event) => setConcepto(event.target.value)}
              placeholder="Ej: Limpieza especial"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cargoTipo">Tipo</Label>
            <Select
              id="cargoTipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoCargo)}
            >
              {TIPOS.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.etiqueta}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cargoMonto">Monto (CLP)</Label>
            <Input
              id="cargoMonto"
              type="number"
              min={1}
              value={monto ?? ''}
              onChange={(event) =>
                setMonto(event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cargoObservaciones">Observaciones</Label>
            <Input
              id="cargoObservaciones"
              value={observaciones}
              maxLength={500}
              onChange={(event) => setObservaciones(event.target.value)}
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'No se pudo registrar el cargo.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          type="button"
          disabled={mutation.isPending || !concepto.trim() || !monto || monto <= 0}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Registrando…' : 'Registrar cargo'}
        </Button>
      </CardContent>
    </Card>
  );
}
