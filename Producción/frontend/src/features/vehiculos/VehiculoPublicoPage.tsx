import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchVehiculo } from './api';

export function VehiculoPublicoPage() {
  const { id } = useParams();
  const vehiculoId = Number(id);
  const query = useQuery({
    queryKey: ['vehiculo-publico', vehiculoId],
    queryFn: () => fetchVehiculo(vehiculoId),
    enabled: Number.isInteger(vehiculoId),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/catalogo" className="text-lg font-semibold text-brand">
            RentaCarDB
          </Link>
          <Link to="/login" className="text-sm text-slate-600 hover:text-brand">
            Iniciar sesion
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Link to="/catalogo" className="text-sm text-brand hover:underline">
          Volver al catalogo
        </Link>

        {query.isLoading && <p className="text-slate-500">Cargando…</p>}
        {query.isError && <p className="text-sm text-red-600">Vehiculo no encontrado.</p>}

        {query.data && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">
                {query.data.marca} {query.data.modelo} · {query.data.anio}
              </h1>
              <p className="text-sm text-slate-600">
                {query.data.tipoVehiculo} · {query.data.combustible} · {query.data.transmision}
              </p>
              <p className="mt-1 text-xl font-semibold text-brand">
                ${query.data.precioDiario.toLocaleString('es-CL')} / dia
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {query.data.fotos.map((foto) => (
                <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer">
                  <img
                    src={foto.thumbUrl}
                    alt={`Foto ${foto.id}`}
                    className="h-28 w-full rounded-md border border-slate-200 object-cover"
                  />
                </a>
              ))}
              {query.data.fotos.length === 0 && (
                <p className="text-sm text-slate-500">Sin fotos.</p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Caracteristicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {query.data.caracteristicas.map((c) => (
                    <li key={c.id} className="rounded-full bg-slate-100 px-3 py-1">
                      {c.nombre}
                    </li>
                  ))}
                  {query.data.caracteristicas.length === 0 && (
                    <li className="text-slate-500">Sin caracteristicas informadas.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tarifas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {query.data.tarifas.map((t) => (
                    <li key={t.id}>
                      {t.nombre}: ${t.precioDia.toLocaleString('es-CL')} / dia ({t.fechaInicio} → {t.fechaFin})
                    </li>
                  ))}
                  {query.data.tarifas.length === 0 && <li className="text-slate-500">Sin tarifas.</li>}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
