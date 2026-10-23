import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchArriendos } from './api';
import { ArriendosTable } from './ArriendosTable';

export function ArriendosPage({ scope }: { scope: 'cliente' | 'proveedor' }) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const effectiveScope =
    scope === 'proveedor' && usuario?.roles.includes('ADMIN') ? 'todos' : scope;
  const query = useQuery({
    queryKey: ['arriendos', effectiveScope, estado, page],
    queryFn: () =>
      fetchArriendos({ scope: effectiveScope, estado: estado || undefined, page, pageSize }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  const titulo =
    effectiveScope === 'todos'
      ? 'Arriendos de la plataforma'
      : scope === 'cliente'
        ? 'Mis alquileres'
        : 'Arriendos de mis vehículos';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{titulo}</h1>
          <p className="text-sm text-slate-600">
            {effectiveScope === 'todos'
              ? 'Todos los arriendos registrados en RentaCarDB.'
              : scope === 'cliente'
                ? 'Arriendos que has realizado en RentaCarDB.'
                : 'Arriendos asociados a los vehículos de tu proveedor.'}
          </p>
        </div>
        <div className="flex gap-2">
          {scope === 'cliente' && (
            <Link to="/reservas">
              <Button variant="outline">Mis reservas</Button>
            </Link>
          )}
          {scope === 'proveedor' && (
            <Link to="/proveedor/reservas">
              <Button variant="outline">Reservas confirmadas</Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} arriendo(s) en total.` : 'Cargando arriendos.'}
            </CardDescription>
          </div>
          <div className="w-full sm:w-48">
            <Select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <p className="text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar los arriendos.</p>
          )}
          {query.data && (
            <ArriendosTable
              arriendos={query.data.data}
              mostrarCliente={effectiveScope !== 'cliente'}
            />
          )}
          {query.data && query.data.total > pageSize && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Página {page} de {totalPaginas}
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

export function MisArriendosPage() {
  return <ArriendosPage scope="cliente" />;
}

export function ArriendosProveedorPage() {
  return <ArriendosPage scope="proveedor" />;
}
