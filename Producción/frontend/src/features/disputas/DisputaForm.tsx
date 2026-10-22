import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { crearDisputa, ETIQUETAS_DISPUTA, type TipoDisputa } from './api';

const TIPOS: TipoDisputa[] = ['DANO', 'COBRO', 'SERVICIO', 'DOCUMENTO', 'OTRO'];

export function DisputaForm({ idArriendo }: { idArriendo: number }) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<TipoDisputa>('DANO');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<number | undefined>();
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      crearDisputa({
        ID_arriendo: idArriendo,
        tipo_disputa: tipo,
        descripcion,
        monto_disputado: monto,
      }),
    onSuccess: () => {
      setMensaje('Disputa abierta. Un administrador la revisara.');
      setDescripcion('');
      setMonto(undefined);
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
      queryClient.invalidateQueries({ queryKey: ['disputas'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir disputa</CardTitle>
        <CardDescription>
          Disputa un cargo, dano o servicio del arriendo. Solo para arriendos finalizados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="disputaTipo">Tipo</Label>
            <Select
              id="disputaTipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoDisputa)}
            >
              {TIPOS.map((item) => (
                <option key={item} value={item}>
                  {ETIQUETAS_DISPUTA[item]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="disputaMonto">Monto disputado (CLP)</Label>
            <Input
              id="disputaMonto"
              type="number"
              min={1}
              value={monto ?? ''}
              onChange={(event) =>
                setMonto(event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="disputaDescripcion">Descripcion</Label>
          <textarea
            id="disputaDescripcion"
            value={descripcion}
            maxLength={1000}
            rows={3}
            onChange={(event) => setDescripcion(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            placeholder="Describe el motivo de la disputa (minimo 10 caracteres)"
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'No se pudo abrir la disputa.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          type="button"
          disabled={mutation.isPending || descripcion.trim().length < 10}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Abriendo…' : 'Abrir disputa'}
        </Button>
      </CardContent>
    </Card>
  );
}
