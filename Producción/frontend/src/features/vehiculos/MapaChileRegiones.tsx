import { useEffect, useRef, useState } from 'react';
import type { CatalogoItem } from '@/features/catalogos/api';
import { cn } from '@/lib/utils';

const SVG_REGION_ALIASES: Record<string, string[]> = {
  Region_Arica_Parinacota: ['arica y parinacota'],
  Region_Tarapaca: ['tarapaca'],
  Region_Antofagasta: ['antofagasta'],
  Region_Atacama: ['atacama'],
  Region_Coquimbo: ['coquimbo'],
  Region_Valparaiso: ['valparaiso'],
  Region_Metropolitana: ['metropolitana de santiago', 'metropolitana'],
  Region_OHiggins: ['libertador gral bernardo o higgins', 'o higgins'],
  Region_Maule: ['maule'],
  'Nuble-9': ['nuble'],
  'Biobio-4': ['biobio'],
  Region_Araucania: ['araucania'],
  Region_Los_Rios: ['los rios'],
  Region_Los_Lagos: ['los lagos'],
  Region_Aisen: ['aisen del gral carlos ibanez del campo', 'aisen', 'aysen'],
  Region_Magallanes: ['magallanes y de la antartica chilena', 'magallanes'],
};

const SVG_REGION_IDS = Object.keys(SVG_REGION_ALIASES);

function normalizar(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^region\s+(de\s+la\s+|del\s+|de\s+)?/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface MapaChileRegionesProps {
  regiones: CatalogoItem[];
  seleccionada?: number;
  onSeleccionar: (id: number) => void;
  className?: string;
}

export function MapaChileRegiones({
  regiones,
  seleccionada,
  onSeleccionar,
  className,
}: MapaChileRegionesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapaSvg, setMapaSvg] = useState('');
  const [hovered, setHovered] = useState<number | undefined>();

  useEffect(() => {
    let activo = true;
    fetch('/images/mapa-chile-regiones-horizontal.svg')
      .then((response) => response.text())
      .then((text) => {
        if (activo) setMapaSvg(text.replace(/<\?xml[^>]*\?>/, ''));
      })
      .catch(() => {
        if (activo) setMapaSvg('');
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const root = containerRef.current?.querySelector('svg');
    if (!root) return;

    const regionesPorNombre = new Map(regiones.map((region) => [normalizar(region.nombre), region]));

    for (const svgId of SVG_REGION_IDS) {
      const node = root.querySelector<SVGElement>(`#${svgId}`);
      if (!node) continue;

      const aliases = SVG_REGION_ALIASES[svgId];
      const region = aliases
        .map((alias) => regionesPorNombre.get(normalizar(alias)))
        .find(Boolean);

      if (!region) continue;
      node.classList.add('mapa-region');
      node.dataset.regionId = String(region.id);
    }
  }, [regiones, mapaSvg]);

  useEffect(() => {
    const root = containerRef.current?.querySelector('svg');
    if (!root) return;

    root.querySelectorAll<SVGElement>('.mapa-region').forEach((node) => {
      node.classList.toggle('is-selected', node.dataset.regionId === String(seleccionada));
    });
  }, [seleccionada, mapaSvg]);

  const hoveredRegion = regiones.find((region) => region.id === hovered);

  return (
    <div className={cn('relative aspect-[5/1] w-full', className)}>
      <div
        ref={containerRef}
        className="mapa-chile h-full w-full"
        aria-hidden="true"
        onClick={(event) => {
          const node = (event.target as Element).closest<SVGElement>('.mapa-region');
          const id = node?.dataset.regionId;
          if (id) onSeleccionar(Number(id));
        }}
        onMouseOver={(event) => {
          const node = (event.target as Element).closest<SVGElement>('.mapa-region');
          const id = node?.dataset.regionId;
          setHovered(id ? Number(id) : undefined);
        }}
        onMouseLeave={() => setHovered(undefined)}
        dangerouslySetInnerHTML={{ __html: mapaSvg }}
      />
      {hoveredRegion && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white shadow-lg">
          {hoveredRegion.nombre}
        </span>
      )}
    </div>
  );
}
