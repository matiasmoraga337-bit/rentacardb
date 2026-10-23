import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchReservas } from './api';
import { ReservasTable } from './ReservasTable';

interface ReservasPageProps {
  scope: 'cliente' | 'proveedor';
}

export function ReservasPage({ scope }: ReservasPageProps) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const effectiveScope =
    scope === 'proveedor' && usuario?.roles.includes('ADMIN') ? 'todos' : scope;

  const query = useQuery({
    queryKey: ['reservas', effectiveScope, estado, page],
    queryFn: () => fetchReservas({ scope: effectiveScope, estado: estado || undefined, page, pageSize }),
  });

  const totalPaginas = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  const titulo =
    effectiveScope === 'todos'
      ? 'Reservas de la plataforma'
      : scope === 'cliente'
        ? 'Mis reservas'
        : 'Reservas de mis vehículos';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{titulo}</h1>
          <p className="text-sm text-slate-600">
            {effectiveScope === 'todos'
              ? 'Todas las reservas registradas en RentaCarDB.'
              : scope === 'cliente'
                ? 'Reservas que has solicitado en RentaCarDB.'
                : 'Reservas asociadas a los vehículos de tu proveedor.'}
          </p>
        </div>
        {scope === 'cliente' && (
          <Link to="/catalogo">
            <Button variant="outline">Buscar vehiculo</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} reserva(s) en total.` : 'Cargando reservas.'}
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
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_CURSO">En curso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="EXPIRADA">Expirada</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <TableSkeleton />}
          {query.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las reservas.</p>
          )}
          {query.data && (
            <ReservasTable
              reservas={query.data.data}
              mostrarCliente={effectiveScope !== 'cliente'}
              mostrarProveedor={effectiveScope === 'todos'}
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

export function MisReservasPage() {
  return <ReservasPage scope="cliente" />;
}

export function ReservasProveedorPage() {
  return <ReservasPage scope="proveedor" />;
}
