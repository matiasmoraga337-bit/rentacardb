import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { GuardarBusqueda } from '@/features/favoritos/GuardarBusqueda';
import { cn } from '@/lib/utils';
import { buscarVehiculos, type BusquedaParams } from './api';
import { CatalogoHero } from './CatalogoHero';
import { FiltrosCatalogo } from './FiltrosCatalogo';
import { VehiculoCard, VehiculoCardSkeleton } from './VehiculoCard';
import { DataModeToggle } from './__fixtures__/DataModeToggle';
import { vehiculosFixture } from './__fixtures__/worstCase';

const PAGE_SIZE = 12;

export function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dataMode = import.meta.env.DEV ? searchParams.get('data') ?? 'demo' : 'demo';
  const [fechaInicio, setFechaInicio] = useState(searchParams.get('desde') ?? '');
  const [fechaFin, setFechaFin] = useState(searchParams.get('hasta') ?? '');
  const [idComuna, setIdComuna] = useState<number | undefined>(
    searchParams.get('comuna') ? Number(searchParams.get('comuna')) : undefined,
  );
  const [idTipo, setIdTipo] = useState<number | undefined>(
    searchParams.get('tipo') ? Number(searchParams.get('tipo')) : undefined,
  );
  const [precioMax, setPrecioMax] = useState<number | undefined>(
    searchParams.get('precio') ? Number(searchParams.get('precio')) : undefined,
  );
  const [pagina, setPagina] = useState(() => {
    const value = Number(searchParams.get('pagina') ?? 1);
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [comunaKey, setComunaKey] = useState(0);
  const [filtros, setFiltros] = useState<BusquedaParams>({
    fecha_inicio: searchParams.get('desde') || undefined,
    fecha_fin: searchParams.get('hasta') || undefined,
    ID_comuna: searchParams.get('comuna') ? Number(searchParams.get('comuna')) : undefined,
    ID_tipo_vehiculo: searchParams.get('tipo') ? Number(searchParams.get('tipo')) : undefined,
    precio_maximo: searchParams.get('precio') ? Number(searchParams.get('precio')) : undefined,
  });

  const query = useQuery({
    queryKey: ['busqueda', filtros],
    queryFn: () => buscarVehiculos(filtros),
  });

  const usandoFixture = import.meta.env.DEV && dataMode !== 'demo';
  const items = usandoFixture ? vehiculosFixture(dataMode) : (query.data ?? []);
  const totalPaginas = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const itemsPagina = items.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);
  const showEmpty =
    items.length === 0 && (usandoFixture || (!query.isLoading && !query.isError));

  const filtrosGuardados = {
    fecha_desde: filtros.fecha_inicio,
    fecha_hasta: filtros.fecha_fin,
    ID_comuna: filtros.ID_comuna,
    ID_tipo_vehiculo: filtros.ID_tipo_vehiculo,
    precio_maximo: filtros.precio_maximo,
  };

  const aplicarFiltros = (): void => {
    setFiltros({
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      ID_comuna: idComuna,
      ID_tipo_vehiculo: idTipo,
      precio_maximo: precioMax,
    });
    setPagina(1);
    setFiltrosAbiertos(false);

    const next = new URLSearchParams(searchParams);
    if (fechaInicio) next.set('desde', fechaInicio);
    else next.delete('desde');
    if (fechaFin) next.set('hasta', fechaFin);
    else next.delete('hasta');
    if (idComuna) next.set('comuna', String(idComuna));
    else next.delete('comuna');
    if (idTipo) next.set('tipo', String(idTipo));
    else next.delete('tipo');
    if (precioMax) next.set('precio', String(precioMax));
    else next.delete('precio');
    next.delete('pagina');
    setSearchParams(next, { replace: false });
  };

  const limpiarFiltros = (): void => {
    setFechaInicio('');
    setFechaFin('');
    setIdComuna(undefined);
    setIdTipo(undefined);
    setPrecioMax(undefined);
    setFiltros({});
    setPagina(1);
    setFiltrosAbiertos(false);
    setComunaKey((current) => current + 1);

    const next = new URLSearchParams(searchParams);
    ['desde', 'hasta', 'comuna', 'tipo', 'precio', 'pagina', 'data'].forEach((key) =>
      next.delete(key),
    );
    setSearchParams(next, { replace: true });
  };

  const cambiarDataMode = (value: string): void => {
    setPagina(1);
    const next = new URLSearchParams(searchParams);
    if (value === 'demo') next.delete('data');
    else next.set('data', value);
    next.delete('pagina');
    setSearchParams(next, { replace: true });
  };

  const irAPagina = (value: number): void => {
    const next = new URLSearchParams(searchParams);
    if (value > 1) next.set('pagina', String(value));
    else next.delete('pagina');
    setSearchParams(next, { replace: true });
    setPagina(value);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <PublicHeader />
      <CatalogoHero
        key={comunaKey}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        idComuna={idComuna}
        onFechaInicio={setFechaInicio}
        onFechaFin={setFechaFin}
        onComuna={setIdComuna}
        onBuscar={aplicarFiltros}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Vehículos disponibles
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {query.isLoading && !usandoFixture
                ? 'Buscando disponibilidad…'
                : `${items.length} ${items.length === 1 ? 'vehículo' : 'vehículos'} para tu búsqueda`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="lg:hidden"
            aria-expanded={filtrosAbiertos}
            aria-controls="filtros-catalogo"
            onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
        </div>

        <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside
            id="filtros-catalogo"
            className={cn(
              'mb-6 lg:sticky lg:top-24 lg:mb-0 lg:block',
              filtrosAbiertos ? 'block' : 'hidden',
            )}
          >
            <div className="space-y-4">
              <FiltrosCatalogo
                idTipo={idTipo}
                precioMax={precioMax}
                onTipo={setIdTipo}
                onPrecioMax={setPrecioMax}
                onBuscar={aplicarFiltros}
                onLimpiar={limpiarFiltros}
              />
              <GuardarBusqueda filtros={filtrosGuardados} />
            </div>
          </aside>

          <section className="min-w-0" aria-label="Resultados del catálogo">
            {!usandoFixture && query.isError && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                No se pudo realizar la búsqueda.
              </p>
            )}

            {!usandoFixture && query.isLoading && (
              <div
                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                aria-busy="true"
                aria-label="Cargando vehículos"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <VehiculoCardSkeleton key={index} />
                ))}
              </div>
            )}

            {itemsPagina.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {itemsPagina.map((item) => (
                  <VehiculoCard
                    key={item.ID_vehiculo}
                    item={item}
                    desde={fechaInicio}
                    hasta={fechaFin}
                  />
                ))}
              </div>
            )}

            {showEmpty && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="font-medium text-slate-900">Sin resultados</p>
                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otras fechas, destino o filtros.
                </p>
                <Button variant="outline" className="mt-4" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </div>
            )}

            {items.length > PAGE_SIZE && (
              <nav
                className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5"
                aria-label="Paginación del catálogo"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginaActual === 1}
                  onClick={() => irAPagina(Math.max(1, paginaActual - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Button>
                <span className="text-sm text-slate-600">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => irAPagina(Math.min(totalPaginas, paginaActual + 1))}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </section>
        </div>
      </main>

      {import.meta.env.DEV && <DataModeToggle value={dataMode} onChange={cambiarDataMode} />}
    </div>
  );
}
