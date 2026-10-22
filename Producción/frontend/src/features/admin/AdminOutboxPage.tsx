import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { formatearFechaHora } from '@/features/reservas/format';
import { fetchOutbox, reintentarOutbox } from './api';

const ESTADOS = ['PENDIENTE', 'PROCESANDO', 'PROCESADO', 'ERROR', 'CANCELADO'];

export function AdminOutboxPage() {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const query = useQuery({
    queryKey: ['admin-outbox', estado, page],
    queryFn: () => fetchOutbox({ estado: estado || undefined, page, pageSize }),
  });
  const retryMutation = useMutation({
    mutationFn: (id: number) => reintentarOutbox(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-outbox'] }),
  });
  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Outbox</h1>
        <p className="text-sm text-slate-600">
          Eventos pendientes, procesados y con error del worker de notificaciones.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} evento(s).` : 'Cargando…'}
            </CardDescription>
          </div>
          <div className="w-48">
            <Select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudo cargar el outbox.</p>}
          {query.data?.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin eventos.</p>
          )}
          {query.data?.data.map((evento) => (
            <div key={evento.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    #{evento.id} · {evento.tipoEvento} · {evento.estado}
                  </p>
                  <p className="text-slate-600">
                    {evento.agregadoTipo} #{evento.agregadoId} · intentos {evento.intentos}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatearFechaHora(evento.fechaCreacion)}
                    {evento.fechaProcesamiento
                      ? ` · procesado ${formatearFechaHora(evento.fechaProcesamiento)}`
                      : ''}
                  </p>
                  {evento.ultimoError && (
                    <p className="text-xs text-red-600">{evento.ultimoError}</p>
                  )}
                </div>
                {evento.estado === 'ERROR' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(evento.id)}
                  >
                    Reintentar
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
