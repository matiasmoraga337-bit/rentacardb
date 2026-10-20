import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { aprobarProveedor, fetchProveedores } from './api';

export function AdminProveedoresPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-proveedores'], queryFn: () => fetchProveedores() });

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => aprobarProveedor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-proveedores'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Proveedores</h1>
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Aprueba proveedores pendientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading && <p className="text-slate-500">Cargando…</p>}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Nombre</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Estado</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {query.data?.map((prov) => (
                <tr key={prov.id} className="border-b border-slate-100">
                  <td className="py-2">{prov.nombreComercial}</td>
                  <td className="py-2">{prov.tipo}</td>
                  <td className="py-2">{prov.estado}</td>
                  <td className="py-2 text-right">
                    {prov.estado === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        onClick={() => aprobarMutation.mutate(prov.id)}
                        disabled={aprobarMutation.isPending}
                      >
                        Aprobar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {query.data?.length === 0 && <p className="py-2 text-sm text-slate-500">Sin proveedores.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
