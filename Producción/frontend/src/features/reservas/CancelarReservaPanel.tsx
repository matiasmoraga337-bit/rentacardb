import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cancelarReserva, fetchCancelacionPreview, nuevaIdempotencyKey } from './api';
import type { Reserva } from './api';
import { formatearCLP } from './format';

export function CancelarReservaPanel({ reserva }: { reserva: Reserva }) {
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState('Cancelacion solicitada por el cliente');
  const [solicitarReembolso, setSolicitarReembolso] = useState(true);
  const [idempotencyKey] = useState(() => nuevaIdempotencyKey('cancel'));
  const [mensaje, setMensaje] = useState('');

  const preview = useQuery({
    queryKey: ['cancelacion-preview', reserva.id],
    queryFn: () => fetchCancelacionPreview(reserva.id),
  });

  useEffect(() => {
    if (preview.data) setSolicitarReembolso(preview.data.elegible);
  }, [preview.data]);

  const mutation = useMutation({
    mutationFn: () =>
      cancelarReserva(
        reserva.id,
        {
          motivo,
          solicitar_reembolso: solicitarReembolso,
          motivo_reembolso: motivo,
        },
        solicitarReembolso ? idempotencyKey : undefined,
      ),
    onSuccess: (result) => {
      setMensaje(
        result.montoReembolsado > 0
          ? `Reserva cancelada. Reembolso registrado por ${formatearCLP(result.montoReembolsado)}.`
          : 'Reserva cancelada sin reembolso.',
      );
      queryClient.invalidateQueries({ queryKey: ['reserva', reserva.id] });
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      queryClient.invalidateQueries({ queryKey: ['cancelacion-preview', reserva.id] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancelar reserva</CardTitle>
        <CardDescription>
          El reembolso se calcula con la politica de cancelacion de la reserva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview.isLoading && <p className="text-sm text-slate-500">Calculando reembolso…</p>}
        {preview.isError && (
          <p className="text-sm text-red-600">No se pudo calcular el reembolso.</p>
        )}

        {preview.data && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p>
              Politica <strong>{preview.data.politica}</strong>
              {preview.data.descripcion ? `: ${preview.data.descripcion}` : ''}
            </p>
            <p className="text-slate-600">
              Pagado {formatearCLP(preview.data.montoPagado)} · Reembolsado{' '}
              {formatearCLP(preview.data.montoReembolsado)} · Reembolso estimado{' '}
              <strong>{formatearCLP(preview.data.montoReembolso)}</strong>
            </p>
            {!preview.data.elegible && (
              <p className="text-amber-700">
                La reserva no cumple las condiciones para reembolso; puedes cancelarla sin
                reembolso.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="motivoCancelacion">Motivo</Label>
          <Input
            id="motivoCancelacion"
            value={motivo}
            maxLength={500}
            onChange={(event) => setMotivo(event.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={solicitarReembolso}
            disabled={!preview.data?.elegible}
            onChange={(event) => setSolicitarReembolso(event.target.checked)}
          />
          Solicitar reembolso
        </label>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'No se pudo cancelar.'}
          </p>
        )}
        {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

        <Button
          variant="destructive"
          disabled={mutation.isPending || motivo.trim().length < 3 || Boolean(mensaje)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Cancelando…' : 'Confirmar cancelacion'}
        </Button>
      </CardContent>
    </Card>
  );
}
