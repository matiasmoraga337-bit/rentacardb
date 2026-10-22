import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarConductor } from './api';

export function ConductorForm({ idArriendo }: { idArriendo: number }) {
  const queryClient = useQueryClient();
  const [rut, setRut] = useState('44444444-4');
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () => registrarConductor(idArriendo, { rut }),
    onSuccess: () => {
      setMensaje('Conductor adicional registrado.');
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar conductor adicional</CardTitle>
        <CardDescription>
          Busca una persona registrada por RUT. Si tiene una licencia activa y verificada, se
          asocia automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="rutConductor">RUT</Label>
          <Input
            id="rutConductor"
            value={rut}
            onChange={(event) => setRut(event.target.value)}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'No se pudo registrar.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button disabled={mutation.isPending || !rut} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Registrando…' : 'Agregar conductor'}
        </Button>
      </CardContent>
    </Card>
  );
}
