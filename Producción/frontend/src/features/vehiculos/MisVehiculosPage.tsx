import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMisVehiculos } from './api';

export function MisVehiculosPage() {
  const query = useQuery({ queryKey: ['mis-vehiculos'], queryFn: fetchMisVehiculos });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis vehiculos</h1>
        <Link to="/proveedor/vehiculos/nuevo">
          <Button>Nuevo vehiculo</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Flota</CardTitle>
          <CardDescription>Vehiculos asociados a tu proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading && <p className="text-slate-500">Cargando…</p>}
          {query.isError && (
            <p className="text-sm text-red-600">
              No se pudieron cargar los vehiculos. ¿Registraste tu proveedor?
            </p>
          )}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Patente</th>
                <th className="py-2">Vehiculo</th>
                <th className="py-2">Precio/dia</th>
                <th className="py-2">Publicacion</th>
                <th className="py-2">Fotos</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {query.data?.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{v.patente}</td>
                  <td className="py-2">
                    {v.marca} {v.modelo} ({v.anio})
                  </td>
                  <td className="py-2">${v.precioDiario.toLocaleString('es-CL')}</td>
                  <td className="py-2">{v.estadoPublicacion}</td>
                  <td className="py-2">{v.fotos}</td>
                  <td className="py-2 text-right">
                    <Link to={`/proveedor/vehiculos/${v.id}`} className="text-brand hover:underline">
                      Administrar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {query.data?.length === 0 && (
            <p className="py-2 text-sm text-slate-500">Aun no tienes vehiculos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
