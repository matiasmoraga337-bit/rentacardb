import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchReserva } from '@/features/reservas/api';
import { EstadoReservaBadge } from '@/features/reservas/EstadoReservaBadge';
import { formatearCLP, formatearFecha, formatearFechaHora } from '@/features/reservas/format';
import { iniciarWebPay } from './api';

export function PagoPage() {
  const { id } = useParams();
  const reservaId = Number(id);
  const navigate = useNavigate();

  const reservaQuery = useQuery({
    queryKey: ['reserva', reservaId],
    queryFn: () => fetchReserva(reservaId),
    enabled: Number.isInteger(reservaId) && reservaId > 0,
  });

  const mutation = useMutation({
    mutationFn: () => iniciarWebPay(reservaId),
    onSuccess: (data) => {
      const qs = new URLSearchParams({
        token_ws: data.token_ws,
        reserva: String(data.ID_reserva),
      });
      navigate(`/webpay/confirmar?${qs.toString()}`);
    },
  });

  if (reservaQuery.isLoading) return <p className="text-slate-500">Cargando reserva…</p>;
  if (reservaQuery.isError || !reservaQuery.data) {
    return <p className="text-sm text-red-600">No se pudo cargar la reserva.</p>;
  }

  const reserva = reservaQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pagar reserva #{reserva.id}</h1>
          <p className="text-sm text-slate-600">
            {reserva.marca} {reserva.modelo} · {reserva.patente}
          </p>
        </div>
        <EstadoReservaBadge estado={reserva.estado} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del pago</CardTitle>
          <CardDescription>Pasarela WebPay simulado para la demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Fechas</span>
            <span>
              {formatearFecha(reserva.fechaInicio)} → {formatearFecha(reserva.fechaFin)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total a pagar</span>
            <span className="text-lg font-semibold">{formatearCLP(reserva.total)}</span>
          </div>
          {reserva.fechaExpiracion && (
            <p className="text-xs text-slate-500">
              La reserva expira el {formatearFechaHora(reserva.fechaExpiracion)}.
            </p>
          )}

          {reserva.estado !== 'PENDIENTE' ? (
            <div className="rounded-md bg-slate-50 p-3 text-slate-700">
              La reserva no esta pendiente de pago. Estado actual: {reserva.estado}.
            </div>
          ) : (
            <>
              {mutation.isError && (
                <p className="rounded-md bg-red-50 p-2 text-red-700">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'No se pudo iniciar el pago.'}
                </p>
              )}
              <Button
                className="w-full"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Iniciando WebPay…' : 'Pagar con WebPay'}
              </Button>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Link to={`/reservas/${reserva.id}`}>
              <Button variant="outline">Ver detalle</Button>
            </Link>
            <Link to="/reservas">
              <Button variant="ghost">Mis reservas</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
