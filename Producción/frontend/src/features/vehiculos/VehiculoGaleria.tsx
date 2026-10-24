import { useEffect, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { VehiculoDetalle } from './api';
import { imagenVehiculo } from './images';

export function VehiculoGaleria({ vehiculo }: { vehiculo: VehiculoDetalle }) {
  const [fotoFallida, setFotoFallida] = useState(false);
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    setFotoFallida(false);
    setActiva(0);
  }, [vehiculo.id]);

  if (vehiculo.fotos.length === 0 || fotoFallida) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <img
          src={imagenVehiculo(vehiculo.tipoVehiculo)}
          alt={`Imagen referencial de ${vehiculo.marca} ${vehiculo.modelo}`}
          className="aspect-[16/9] max-h-[480px] w-full object-cover"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          Imagen referencial
        </span>
      </div>
    );
  }

  const total = vehiculo.fotos.length;
  const foto = vehiculo.fotos[activa] ?? vehiculo.fotos[0];
  const mover = (delta: number): void => {
    setActiva((current) => (current + delta + total) % total);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      mover(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      mover(1);
    }
  };

  return (
    <div
      className="space-y-3"
      role="group"
      aria-label="Galería de fotos del vehículo"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <img
          src={assetUrl(foto.url) ?? ''}
          alt={`${vehiculo.marca} ${vehiculo.modelo}, foto ${activa + 1} de ${total}`}
          onError={() => setFotoFallida(true)}
          className="aspect-[16/9] max-h-[480px] w-full object-cover"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => mover(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/75"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => mover(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/75"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
              {activa + 1} / {total}
            </span>
          </>
        )}

        <a
          href={assetUrl(foto.url) ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-slate-950/80"
        >
          Ver original
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      {total > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {vehiculo.fotos.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              aria-pressed={index === activa}
              onClick={() => setActiva(index)}
              className={cn(
                'overflow-hidden rounded-lg border-2 bg-white transition',
                index === activa
                  ? 'border-brand'
                  : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              <img
                src={assetUrl(item.thumbUrl) ?? assetUrl(item.url) ?? ''}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
