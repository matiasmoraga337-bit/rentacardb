import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { FavoritoButton } from '@/features/favoritos/FavoritoButton';
import { formatearCLP } from '@/features/reservas/format';
import { buscarVehiculos, type BusquedaItem } from '@/features/vehiculos/api';

const VARIANTS = ['Densa', 'Editorial', 'Operativa'] as const;

const pickerCss = `
.proto-picker{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(10,10,10,.82);-webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4);box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 8px 24px rgba(0,0,0,.24),0 2px 6px rgba(0,0,0,.12);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1;-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
.proto-picker-highlight{position:absolute;top:4px;left:0;height:28px;border-radius:999px;background:rgba(255,255,255,.12);will-change:transform}
.proto-picker[data-ready] .proto-picker-highlight{transition:transform 250ms cubic-bezier(.23,1,.32,1),width 250ms cubic-bezier(.23,1,.32,1)}
@media (prefers-reduced-motion:reduce){.proto-picker[data-ready] .proto-picker-highlight{transition:none}}
.proto-picker-item{position:relative;display:flex;align-items:center;height:28px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.55);font:inherit;cursor:pointer;transition:color 150ms ease-out}
.proto-picker-item:hover{color:rgba(255,255,255,.85)}
.proto-picker-item:active{transform:scale(.97)}
.proto-picker-item:focus-visible{outline:2px solid rgba(255,255,255,.4);outline-offset:2px}
.proto-picker-item[data-active]{color:#fff}
.proto-picker-divider{width:1px;height:16px;margin:0 4px;background:rgba(255,255,255,.12)}
.proto-picker-replay{padding:0 10px;font-size:14px}
`;

function VehiculoBase({ item }: { item: BusquedaItem }) {
  return (
    <>
      <p className="truncate font-semibold">
        {item.nombre_marca} {item.nombre_modelo}
      </p>
      <p className="truncate text-sm text-slate-600">
        {item.anio_vehiculo} · {item.nombre_tipo_vehiculo} · {item.patente_vehiculo}
      </p>
    </>
  );
}

function Densa({ items }: { items: BusquedaItem[] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-2">
      {items.map((item) => (
        <Link
          key={item.ID_vehiculo}
          to={`/catalogo/${item.ID_vehiculo}`}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
        >
          <div className="grid h-12 w-16 shrink-0 place-items-center rounded bg-slate-100 text-xs font-semibold text-slate-500">
            {item.patente_vehiculo}
          </div>
          <div className="min-w-0 flex-1">
            <VehiculoBase item={item} />
            <p className="truncate text-xs text-slate-500">
              {item.nombre_comuna ?? 'Sin comuna'} · {item.nombre_comercial_proveedor}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="font-semibold text-brand">
              {formatearCLP(item.precio_cotizado ?? item.precio_diario_base_vehiculo)}
            </p>
            <FavoritoButton vehiculoId={item.ID_vehiculo} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function Editorial({ items }: { items: BusquedaItem[] }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.ID_vehiculo}
          to={`/catalogo/${item.ID_vehiculo}`}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
        >
          <div className="relative flex h-36 items-end bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 p-4 text-white">
            <div className="absolute right-3 top-3">
              <FavoritoButton vehiculoId={item.ID_vehiculo} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-100">
                {item.nombre_marca}
              </p>
              <p className="text-2xl font-semibold leading-tight">{item.nombre_modelo}</p>
            </div>
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xl font-semibold text-brand">
                {formatearCLP(item.precio_cotizado ?? item.precio_diario_base_vehiculo)}
                <span className="text-sm font-normal text-slate-500"> / dia</span>
              </p>
              <p className="shrink-0 text-xs text-slate-500">{item.anio_vehiculo}</p>
            </div>
            <p className="text-sm text-slate-600">
              {item.nombre_tipo_vehiculo} · {item.patente_vehiculo}
            </p>
            <p className="truncate text-sm text-slate-500">
              {item.nombre_comuna ?? 'Sin comuna'}
              {item.nombre_region ? ` · ${item.nombre_region}` : ''}
            </p>
            <p className="truncate text-xs text-slate-400">{item.nombre_comercial_proveedor}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Operativa({ items }: { items: BusquedaItem[] }) {
  return (
    <div className="mx-auto max-w-6xl overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Vehiculo</th>
            <th className="px-3 py-2">Patente</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Sede</th>
            <th className="px-3 py-2">Proveedor</th>
            <th className="px-3 py-2 text-right">Precio/dia</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.ID_vehiculo} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">
                {item.nombre_marca} {item.nombre_modelo}{' '}
                <span className="text-slate-500">({item.anio_vehiculo})</span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">{item.patente_vehiculo}</td>
              <td className="px-3 py-2">{item.nombre_tipo_vehiculo}</td>
              <td className="px-3 py-2">{item.nombre_comuna ?? '—'}</td>
              <td className="truncate px-3 py-2">{item.nombre_comercial_proveedor}</td>
              <td className="px-3 py-2 text-right font-semibold text-brand">
                {formatearCLP(item.precio_cotizado ?? item.precio_diario_base_vehiculo)}
              </td>
              <td className="px-3 py-2">
                <FavoritoButton vehiculoId={item.ID_vehiculo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CatalogoPrototypesPage() {
  const [params, setParams] = useSearchParams();
  const activeIndex = Math.min(
    Math.max(Number(params.get('v') ?? '1') - 1, 0),
    VARIANTS.length - 1,
  );
  const [replayKey, setReplayKey] = useState(0);
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  const query = useQuery({
    queryKey: ['prototype-catalogo'],
    queryFn: () => buscarVehiculos({}),
  });

  const setActive = (index: number): void => {
    const next = Math.min(Math.max(index, 0), VARIANTS.length - 1);
    const nextParams = new URLSearchParams(params);
    nextParams.set('v', String(next + 1));
    setParams(nextParams, { replace: true });
    setReplayKey((value) => value + 1);
  };

  const moveHighlight = (): void => {
    const item = itemRefs.current[activeIndex];
    if (!item || !highlightRef.current) return;
    highlightRef.current.style.width = `${item.offsetWidth}px`;
    highlightRef.current.style.transform = `translateX(${item.offsetLeft}px)`;
  };

  useEffect(() => {
    moveHighlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, query.data]);

  useEffect(() => {
    const onResize = (): void => moveHighlight();
    window.addEventListener('resize', onResize);
    const frame = requestAnimationFrame(() => {
      setReady(true);
      moveHighlight();
    });
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= VARIANTS.length) setActive(number - 1);
      else if (event.key === 'ArrowRight') setActive((activeIndex + 1) % VARIANTS.length);
      else if (event.key === 'ArrowLeft') {
        setActive((activeIndex - 1 + VARIANTS.length) % VARIANTS.length);
      } else if (event.key === 'r' || event.key === 'R') {
        setReplayKey((value) => value + 1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const items = query.data ?? [];
  const activeVariant = VARIANTS[activeIndex];

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <style>{pickerCss}</style>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
              Prototipo
            </p>
            <h1 className="text-2xl font-semibold">Catalogo · {activeVariant}</h1>
          </div>
          <Link to="/catalogo" className="text-sm text-slate-500 hover:text-brand">
            Volver al catalogo real
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 pb-24 sm:py-8">
        {query.isLoading && <p className="text-sm text-slate-500">Cargando vehiculos…</p>}
        {query.isError && (
          <p className="text-sm text-red-600">No se pudo cargar el catalogo.</p>
        )}
        {!query.isLoading && !query.isError && items.length === 0 && (
          <p className="text-sm text-slate-500">Sin vehiculos para prototipar.</p>
        )}
        {items.length > 0 && (
          <div key={`${activeVariant}-${replayKey}`}>
            {activeVariant === 'Densa' && <Densa items={items} />}
            {activeVariant === 'Editorial' && <Editorial items={items} />}
            {activeVariant === 'Operativa' && <Operativa items={items} />}
          </div>
        )}
      </main>

      <nav
        ref={pickerRef}
        className="proto-picker"
        aria-label="Variantes del prototipo"
        data-ready={ready || undefined}
      >
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((variant, index) => (
          <button
            key={variant}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            type="button"
            className="proto-picker-item"
            data-active={index === activeIndex || undefined}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActive(index)}
          >
            {variant}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          type="button"
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay (R)"
          onClick={() => setReplayKey((value) => value + 1)}
        >
          ↻
        </button>
      </nav>
    </div>
  );
}
