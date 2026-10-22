import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import { formatearCLP, formatearFechaHora } from '@/features/reservas/format';
import {
  ETIQUETAS_DISPUTA,
  fetchDisputas,
  resolverDisputa,
  type Disputa,
  type EstadoDisputa,
} from './api';

const ESTADOS: { valor: EstadoDisputa; etiqueta: string }[] = [
  { valor: 'ABIERTA', etiqueta: 'Abierta' },
  { valor: 'EN_REVISION', etiqueta: 'En revision' },
  { valor: 'RESUELTA', etiqueta: 'Resuelta' },
  { valor: 'CERRADA', etiqueta: 'Cerrada' },
];

function ResolucionForm({ disputa }: { disputa: Disputa }) {
  const queryClient = useQueryClient();
  const [resolucion, setResolucion] = useState('');
  const mutation = useMutation({
    mutationFn: () => resolverDisputa(disputa.id, { estado: 'RESUELTA', resolucion }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['disputas'] }),
  });
  const tomarMutation = useMutation({
    mutationFn: () => resolverDisputa(disputa.id, { estado: 'EN_REVISION' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['disputas'] }),
  });

  return (
    <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
      <textarea
        value={resolucion}
        onChange={(event) => setResolucion(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Resolucion (minimo 10 caracteres)"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {mutation.isError && (
        <p className="text-sm text-red-600">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'No se pudo resolver la disputa.'}
        </p>
      )}
      <div className="flex gap-2">
        {disputa.estado === 'ABIERTA' && (
          <Button
            size="sm"
            variant="outline"
            disabled={tomarMutation.isPending}
            onClick={() => tomarMutation.mutate()}
          >
            Tomar en revision
          </Button>
        )}
        <Button
          size="sm"
          disabled={mutation.isPending || resolucion.trim().length < 10}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Resolviendo…' : 'Resolver'}
        </Button>
      </div>
    </div>
  );
}

export function DisputasPage({ modoAdmin = false }: { modoAdmin?: boolean }) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState<EstadoDisputa | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const query = useQuery({
    queryKey: ['disputas', modoAdmin, estado, page],
    queryFn: () =>
      fetchDisputas({
        scope: modoAdmin ? 'todos' : undefined,
        estado: estado || undefined,
        page,
        pageSize,
      }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  const esAdmin = modoAdmin || usuario?.roles.includes('ADMIN');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{modoAdmin ? 'Disputas (admin)' : 'Disputas'}</h1>
        <p className="text-sm text-slate-600">
          {modoAdmin
            ? 'Revisa y resuelve las disputas abiertas por clientes y proveedores.'
            : 'Disputas asociadas a tus arriendos.'}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} disputa(s) en total.` : 'Cargando disputas.'}
            </CardDescription>
          </div>
          <div className="w-48">
            <Select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value as EstadoDisputa | '');
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
        <CardContent className="space-y-3">
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las disputas.</p>
          )}
          {query.data?.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin disputas registradas.</p>
          )}
          {query.data?.data.map((disputa) => (
            <div key={disputa.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    #{disputa.id} · {ETIQUETAS_DISPUTA[disputa.tipo]} · {disputa.estado}
                  </p>
                  <p className="text-slate-600">
                    Arriendo #{disputa.arriendoId} · {disputa.cliente} / {disputa.proveedor}
                  </p>
                  <p className="text-slate-600">{disputa.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    Autor: {disputa.autor} · {formatearFechaHora(disputa.fechaApertura)}
                    {disputa.monto !== null ? ` · ${formatearCLP(disputa.monto)}` : ''}
                  </p>
                  {disputa.resolucion && (
                    <p className="mt-1 text-slate-700">
                      <span className="font-medium">Resolucion:</span> {disputa.resolucion}
                    </p>
                  )}
                </div>
                <Link to={`/arriendos/${disputa.arriendoId}`} className="text-brand hover:underline">
                  Ver arriendo
                </Link>
              </div>
              {esAdmin &&
                (disputa.estado === 'ABIERTA' || disputa.estado === 'EN_REVISION') && (
                  <ResolucionForm disputa={disputa} />
                )}
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

export function AdminDisputasPage() {
  return <DisputasPage modoAdmin />;
}
