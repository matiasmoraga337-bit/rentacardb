import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UbicacionSelect } from '@/components/forms/UbicacionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';
import { FavoritoButton } from '@/features/favoritos/FavoritoButton';
import { GuardarBusqueda } from '@/features/favoritos/GuardarBusqueda';
import { buscarVehiculos, type BusquedaParams } from './api';

export function CatalogoPage() {
  const tipos = useCatalogo('tipos-vehiculo');
  const [searchParams] = useSearchParams();
  const desdeParam = searchParams.get('desde') ?? '';
  const hastaParam = searchParams.get('hasta') ?? '';
  const comunaParam = searchParams.get('comuna');
  const tipoParam = searchParams.get('tipo');
  const precioParam = searchParams.get('precio');
  const [fechaInicio, setFechaInicio] = useState(desdeParam);
  const [fechaFin, setFechaFin] = useState(hastaParam);
  const [idComuna, setIdComuna] = useState<number | undefined>(
    comunaParam ? Number(comunaParam) : undefined,
  );
  const [idTipo, setIdTipo] = useState<number | undefined>(
    tipoParam ? Number(tipoParam) : undefined,
  );
  const [precioMax, setPrecioMax] = useState<number | undefined>(
    precioParam ? Number(precioParam) : undefined,
  );
  const [filtros, setFiltros] = useState<BusquedaParams>({
    fecha_inicio: desdeParam || undefined,
    fecha_fin: hastaParam || undefined,
    ID_comuna: comunaParam ? Number(comunaParam) : undefined,
    ID_tipo_vehiculo: tipoParam ? Number(tipoParam) : undefined,
    precio_maximo: precioParam ? Number(precioParam) : undefined,
  });

  const query = useQuery({
    queryKey: ['busqueda', filtros],
    queryFn: () => buscarVehiculos(filtros),
  });

  const buscar = (): void => {
    setFiltros({
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      ID_comuna: idComuna,
      ID_tipo_vehiculo: idTipo,
      precio_maximo: precioMax,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold text-brand">RentaCarDB</span>
          <Link to="/login" className="text-sm text-slate-600 hover:text-brand">
            Iniciar sesion
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Catalogo de vehiculos</h1>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="desde">Desde</Label>
                <Input id="desde" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hasta">Hasta</Label>
                <Input id="hasta" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
            <UbicacionSelect onChange={setIdComuna} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={idTipo ?? ''}
                  onChange={(e) => setIdTipo(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Todos</option>
                  {tipos.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="precio">Precio maximo (CLP)</Label>
                <Input
                  id="precio"
                  type="number"
                  min={0}
                  value={precioMax ?? ''}
                  onChange={(e) => setPrecioMax(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={buscar}>
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <GuardarBusqueda filtros={filtros} />

        {query.isLoading && <p className="text-slate-500">Buscando…</p>}
        {query.isError && <p className="text-sm text-red-600">No se pudo realizar la busqueda.</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.map((item) => (
            <Link
              key={item.ID_vehiculo}
              to={`/catalogo/${item.ID_vehiculo}${
                fechaInicio && fechaFin
                  ? `?desde=${encodeURIComponent(fechaInicio)}&hasta=${encodeURIComponent(fechaFin)}`
                  : ''
              }`}
            >
              <Card className="relative h-full transition-shadow hover:shadow-md">
                <div className="absolute right-2 top-2 z-10">
                  <FavoritoButton vehiculoId={item.ID_vehiculo} />
                </div>
                <CardContent className="space-y-1 p-4">
                  <p className="font-semibold">
                    {item.nombre_marca} {item.nombre_modelo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.anio_vehiculo} · {item.nombre_tipo_vehiculo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.nombre_comuna ?? 'Sin comuna'} {item.nombre_region ? `· ${item.nombre_region}` : ''}
                  </p>
                  <p className="pt-1 text-lg font-semibold text-brand">
                    ${(item.precio_cotizado ?? item.precio_diario_base_vehiculo).toLocaleString('es-CL')} / dia
                  </p>
                  <p className="text-xs text-slate-500">{item.nombre_comercial_proveedor}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {query.data?.length === 0 && <p className="text-sm text-slate-500">Sin resultados.</p>}
      </main>
    </div>
  );
}
