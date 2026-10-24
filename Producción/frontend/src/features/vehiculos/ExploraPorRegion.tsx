import { MapPin, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRegiones } from '@/features/catalogos/hooks';
import { MapaChileRegiones } from './MapaChileRegiones';

interface ExploraPorRegionProps {
  idRegion?: number;
  onSeleccionar: (id: number | undefined) => void;
}

export function ExploraPorRegion({ idRegion, onSeleccionar }: ExploraPorRegionProps) {
  const regiones = useRegiones();

  return (
    <section
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="explora-region-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Explora por región
          </p>
          <h2
            id="explora-region-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            ¿Dónde quieres retirar tu auto?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pasa el cursor por el mapa o usa el selector para filtrar por región.
          </p>
        </div>

        <div className="flex w-full items-end gap-2 sm:w-80">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="region-mapa">Región</Label>
            {regiones.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                id="region-mapa"
                value={idRegion ?? ''}
                onChange={(event) =>
                  onSeleccionar(event.target.value ? Number(event.target.value) : undefined)
                }
              >
                <option value="">Todas las regiones</option>
                {regiones.data?.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nombre}
                  </option>
                ))}
              </Select>
            )}
          </div>
          {idRegion && (
            <button
              type="button"
              aria-label="Quitar filtro de región"
              onClick={() => onSeleccionar(undefined)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {regiones.isError && (
        <p className="mt-4 text-sm text-red-600">No se pudieron cargar las regiones.</p>
      )}

      <div className="mt-5 hidden lg:block">
        <div className="relative rounded-xl bg-gradient-to-r from-slate-50 via-white to-slate-50 p-2">
          <MapaChileRegiones
            regiones={regiones.data ?? []}
            seleccionada={idRegion}
            onSeleccionar={onSeleccionar}
          />
          <span className="pointer-events-none absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Norte
          </span>
          <span className="pointer-events-none absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Sur
          </span>
        </div>
        <a
          href="https://commons.wikimedia.org/wiki/File:Mapa_de_Chile_(regiones).svg"
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-right text-[10px] text-slate-500 hover:text-slate-700"
        >
          Mapa: B1mbo / Wikimedia · CC BY-SA 3.0 CL
        </a>
      </div>
    </section>
  );
}
