import { useState } from 'react';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RatingStars, formatRating } from '@/components/ui/rating-stars';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoritoButton } from '@/features/favoritos/FavoritoButton';
import { formatearCLP } from '@/features/reservas/format';
import { assetUrl } from '@/lib/api';
import type { BusquedaItem } from './api';
import { imagenVehiculo } from './images';

interface VehiculoCardProps {
  item: BusquedaItem;
  desde: string;
  hasta: string;
}

export function VehiculoCard({ item, desde, hasta }: VehiculoCardProps) {
  const [fotoFallida, setFotoFallida] = useState(false);
  const precio = item.precio_cotizado ?? item.precio_diario_base_vehiculo;
  const fotoReal = assetUrl(item.url_foto_principal_thumb ?? item.url_foto_principal);
  const mostrarPlaceholder = !fotoReal || fotoFallida;
  const foto = mostrarPlaceholder ? imagenVehiculo(item.nombre_tipo_vehiculo) : fotoReal;
  const altFoto = mostrarPlaceholder
    ? `Imagen referencial de ${item.nombre_marca} ${item.nombre_modelo}`
    : `${item.nombre_marca} ${item.nombre_modelo}`;
  const ubicacion = [item.nombre_comuna, item.nombre_region].filter(Boolean).join(', ');
  const fechas =
    desde && hasta
      ? `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      : '';

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <Link
        to={`/catalogo/${item.ID_vehiculo}${fechas}`}
        className="flex h-full min-w-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={foto}
            alt={altFoto}
            loading="lazy"
            decoding="async"
            onError={() => setFotoFallida(true)}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            {item.nombre_tipo_vehiculo}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <h3
              className="line-clamp-2 break-words text-base font-semibold leading-snug text-slate-900"
              dir="auto"
              title={`${item.nombre_marca} ${item.nombre_modelo}`}
            >
              {item.nombre_marca} {item.nombre_modelo}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {item.anio_vehiculo} ·{' '}
              <span className="font-mono text-[11px]">{item.patente_vehiculo}</span>
            </p>
          </div>

          <div className="flex min-h-5 items-center gap-2">
            {item.calificacion_promedio_vehiculo !== null ? (
              <>
                <RatingStars value={item.calificacion_promedio_vehiculo} />
                <span className="text-xs font-medium text-slate-600">
                  {formatRating(item.calificacion_promedio_vehiculo)}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-500">Sin reseñas</span>
            )}
          </div>

          <div className="space-y-1 text-sm text-slate-600">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 truncate" title={ubicacion || 'Sin comuna'}>
                {ubicacion || 'Sin comuna'}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span
                className="min-w-0 truncate text-xs text-slate-500"
                title={item.nombre_comercial_proveedor}
                dir="auto"
              >
                {item.nombre_comercial_proveedor}
              </span>
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-xl font-bold tracking-tight text-brand sm:text-2xl">
              {formatearCLP(precio)}
              <span className="ml-1 text-xs font-normal text-slate-500">/ día</span>
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand">
              Ver
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <FavoritoButton vehiculoId={item.ID_vehiculo} />
      </div>
    </article>
  );
}

export function VehiculoCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}