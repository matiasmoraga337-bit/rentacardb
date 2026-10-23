import { useEffect, useState } from 'react';
import { assetUrl } from '@/lib/api';
import type { VehiculoDetalle } from './api';
import { imagenVehiculo } from './images';

export function VehiculoGaleria({ vehiculo }: { vehiculo: VehiculoDetalle }) {
  const [fotoFallida, setFotoFallida] = useState(false);

  useEffect(() => {
    setFotoFallida(false);
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

  const [principal, ...restantes] = vehiculo.fotos;

  return (
    <div className="space-y-3">
      <a
        href={assetUrl(principal.url) ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-2xl border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <img
          src={assetUrl(principal.url) ?? ''}
          alt={`${vehiculo.marca} ${vehiculo.modelo}`}
          onError={() => setFotoFallida(true)}
          className="aspect-[16/9] max-h-[480px] w-full object-cover"
        />
      </a>

      {restantes.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {restantes.map((foto) => (
            <a
              key={foto.id}
              href={assetUrl(foto.url) ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-lg border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <img
                src={assetUrl(foto.thumbUrl) ?? ''}
                alt={`Foto ${foto.id} de ${vehiculo.marca} ${vehiculo.modelo}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
