import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatearCLP } from '@/features/reservas/format';
import { confirmarWebPay, fetchTransaccion } from './api';

export function WebPayConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token_ws') ?? '';
  const reservaParam = searchParams.get('reserva');

  const transaccionQuery = useQuery({
    queryKey: ['webpay-transaccion', token],
    queryFn: () => fetchTransaccion(token),
    enabled: token.length === 64,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (aprobada: boolean) => confirmarWebPay(token, aprobada),
    onSuccess: (data) => navigate(`/reservas/${data.ID_reserva}`),
  });

  if (token.length !== 64) {
    return <p className="text-sm text-red-600">Token de WebPay invalido o ausente.</p>;
  }

  const transaccion = transaccionQuery.data;
  const resuelta = transaccion && transaccion.estadoTransaccion !== 'CREADA';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">WebPay simulado</h1>
        <p className="text-sm text-slate-600">
          Esta pantalla emula la confirmacion de la pasarela. No se cobra dinero real.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaccion</CardTitle>
          <CardDescription>
            {reservaParam ? `Reserva #${reservaParam}` : 'Confirma la operacion simulada.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {transaccionQuery.isLoading && <p className="text-slate-500">Consultando transaccion…</p>}
          {transaccionQuery.isError && (
            <p className="text-sm text-red-600">
              {transaccionQuery.error instanceof Error
                ? transaccionQuery.error.message
                : 'No se pudo consultar la transaccion.'}
            </p>
          )}

          {transaccion && (
            <>
              <div className="flex justify-between">
                <span>Monto</span>
                <span className="text-lg font-semibold">{formatearCLP(transaccion.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado de la transaccion</span>
                <span>{transaccion.estadoTransaccion}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado de la reserva</span>
                <span>{transaccion.estadoReserva}</span>
              </div>
            </>
          )}

          {mutation.isError && (
            <p className="rounded-md bg-red-50 p-2 text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'No se pudo confirmar el pago.'}
            </p>
          )}

          {resuelta ? (
            <div className="rounded-md bg-slate-50 p-3 text-slate-700">
              La transaccion ya fue resuelta. Puedes volver al detalle de la reserva.
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={mutation.isPending || !transaccion}
                onClick={() => mutation.mutate(true)}
              >
                {mutation.isPending ? 'Confirmando…' : 'Aprobar pago'}
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                disabled={mutation.isPending || !transaccion}
                onClick={() => mutation.mutate(false)}
              >
                Rechazar pago
              </Button>
            </div>
          )}

          {transaccion && (
            <Link
              to={`/reservas/${transaccion.idReserva}`}
              className="block text-center text-sm text-brand hover:underline"
            >
              Volver a la reserva
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
