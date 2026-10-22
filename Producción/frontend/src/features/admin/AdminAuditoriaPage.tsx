import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatearFechaHora } from '@/features/reservas/format';
import { fetchAuditoria } from './api';

export function AdminAuditoriaPage() {
  const [entidad, setEntidad] = useState('');
  const [filtro, setFiltro] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const query = useQuery({
    queryKey: ['admin-auditoria', filtro, page],
    queryFn: () => fetchAuditoria({ entidad: filtro || undefined, page, pageSize }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="text-sm text-slate-600">Eventos registrados por los triggers de la base.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between space-y-0">
          <div>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} evento(s) en total.` : 'Cargando eventos.'}
            </CardDescription>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setFiltro(entidad.trim());
            }}
          >
            <div className="w-40 space-y-1">
              <Label htmlFor="entidad">Entidad</Label>
              <Input
                id="entidad"
                value={entidad}
                placeholder="Reserva, Pago…"
                onChange={(event) => setEntidad(event.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-3">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudo cargar la auditoria.</p>
          )}
          {query.data && query.data.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin eventos registrados.</p>
          )}
          {query.data && query.data.data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Entidad</th>
                  <th className="py-2">Accion</th>
                  <th className="py-2">Usuario</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((evento) => (
                  <tr key={evento.id} className="border-b border-slate-100 align-top">
                    <td className="py-2">{formatearFechaHora(evento.fecha)}</td>
                    <td className="py-2">
                      {evento.entidad}
                      {evento.registroId !== null ? ` #${evento.registroId}` : ''}
                    </td>
                    <td className="py-2">{evento.accion}</td>
                    <td className="py-2">{evento.usuario ?? 'Sistema'}</td>
                    <td className="py-2 text-slate-600">
                      {evento.descripcion ?? evento.motivo ?? '—'}
                      {evento.origen ? ` · ${evento.origen}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
