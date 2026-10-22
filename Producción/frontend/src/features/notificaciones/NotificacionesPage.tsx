import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { formatearFechaHora } from '@/features/reservas/format';
import {
  fetchNotificaciones,
  marcarNotificacionLeida,
  type EstadoNotificacion,
} from './api';

const ESTADOS: { valor: EstadoNotificacion; etiqueta: string }[] = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'ENVIADA', etiqueta: 'Enviada' },
  { valor: 'LEIDA', etiqueta: 'Leida' },
  { valor: 'FALLIDA', etiqueta: 'Fallida' },
];

export function NotificacionesPage() {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoNotificacion | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const query = useQuery({
    queryKey: ['notificaciones', estado, page],
    queryFn: () => fetchNotificaciones({ estado: estado || undefined, page, pageSize }),
  });
  const leerMutation = useMutation({
    mutationFn: (id: number) => marcarNotificacionLeida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        <p className="text-sm text-slate-600">Mensajes y eventos de tu cuenta.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Bandeja</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} notificacion(es).` : 'Cargando…'}
            </CardDescription>
          </div>
          <div className="w-48">
            <Select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value as EstadoNotificacion | '');
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.etiqueta}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las notificaciones.</p>
          )}
          {query.data?.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin notificaciones.</p>
          )}
          {query.data?.data.map((notificacion) => (
            <div
              key={notificacion.id}
              className={
                notificacion.estado === 'LEIDA'
                  ? 'rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm'
                  : 'rounded-lg border border-brand/30 bg-emerald-50/40 p-3 text-sm'
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{notificacion.asunto ?? notificacion.tipo}</p>
                  <p className="text-slate-600">{notificacion.cuerpo ?? 'Sin detalle.'}</p>
                  <p className="text-xs text-slate-500">
                    {formatearFechaHora(notificacion.fechaCreacion)} · {notificacion.canal} ·{' '}
                    {notificacion.estado}
                  </p>
                </div>
                {notificacion.estado !== 'LEIDA' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={leerMutation.isPending}
                    onClick={() => leerMutation.mutate(notificacion.id)}
                  >
                    Marcar leida
                  </Button>
                )}
              </div>
            </div>
          ))}
          {query.data && query.data.total > pageSize && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Pagina {page} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((value) => Math.min(totalPaginas, value + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
