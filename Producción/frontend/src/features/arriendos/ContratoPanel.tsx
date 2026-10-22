import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { aceptarContrato, fetchContrato } from './api';

export function ContratoPanel({
  idArriendo,
  puedeAceptar = true,
}: {
  idArriendo: number;
  puedeAceptar?: boolean;
}) {
  const queryClient = useQueryClient();
  const [aceptado, setAceptado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const query = useQuery({
    queryKey: ['contrato', idArriendo],
    queryFn: () => fetchContrato(idArriendo),
  });

  const mutation = useMutation({
    mutationFn: () => aceptarContrato(idArriendo),
    onSuccess: () => {
      setMensaje('Contrato aceptado y registrado.');
      queryClient.invalidateQueries({ queryKey: ['contrato', idArriendo] });
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contrato de arriendo</CardTitle>
        <CardDescription>
          Revisa las condiciones y acepta el contrato. Se guarda una version con hash SHA-256.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && <p className="text-sm text-slate-500">Generando contrato…</p>}
        {query.isError && <p className="text-sm text-red-600">No se pudo cargar el contrato.</p>}
        {query.data && (
          <>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {query.data.texto}
            </pre>
            <p className="break-all text-xs text-slate-500">Hash: {query.data.hash}</p>
            {query.data.aceptacion && (
              <p className="text-sm text-emerald-700">
                Aceptado en version {query.data.aceptacion.version} el{' '}
                {new Date(query.data.aceptacion.fecha).toLocaleString('es-CL')}.
              </p>
            )}
          </>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={aceptado}
            disabled={!puedeAceptar}
            onChange={(event) => setAceptado(event.target.checked)}
            className="mt-1"
          />
          Declaro haber leido y aceptar el contrato de arriendo.
        </label>

        {!puedeAceptar && (
          <p className="text-sm text-amber-700">
            El contrato solo se puede aceptar mientras el arriendo esta activo.
          </p>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'No se pudo aceptar.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          disabled={!puedeAceptar || !aceptado || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Aceptando…' : 'Aceptar contrato'}
        </Button>
      </CardContent>
    </Card>
  );
}
