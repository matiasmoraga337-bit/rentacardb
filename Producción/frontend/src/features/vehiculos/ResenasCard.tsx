import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingStars, formatRating } from '@/components/ui/rating-stars';
import { formatearFechaHora } from '@/features/reservas/format';
import type { ResenasVehiculo } from '@/features/resenas/api';

interface ResenasCardProps {
  title: string;
  data?: ResenasVehiculo;
  isLoading: boolean;
  isError: boolean;
}

export function ResenasCard({ title, data, isLoading, isError }: ResenasCardProps) {
  const resenas = data?.resenas ?? [];
  const promedio = data?.promedio ?? null;
  const total = data?.total ?? 0;
  const tieneResenas = total > 0 && promedio !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>
          {isLoading && 'Cargando reseñas…'}
          {isError && 'No se pudieron cargar las reseñas.'}
          {tieneResenas && promedio !== null && (
            <span className="flex flex-wrap items-center gap-2">
              <RatingStars
                value={promedio}
                label={`Calificación promedio: ${formatRating(promedio)} de 5`}
              />
              <span>
                {formatRating(promedio)} · {total}{' '}
                {total === 1 ? 'reseña' : 'reseñas'}
              </span>
            </span>
          )}
          {!isLoading && !isError && !tieneResenas && 'Sin reseñas todavía.'}
        </CardDescription>
      </CardHeader>
      {tieneResenas && (
        <CardContent className="space-y-2">
          {resenas.map((resena) => (
            <article
              key={resena.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStars value={resena.calificacion} />
                <span className="text-xs text-slate-500">
                  {formatearFechaHora(resena.fecha)}
                </span>
              </div>
              <p className="mt-2 text-slate-700">{resena.comentario ?? 'Sin comentario.'}</p>
              <p className="mt-1 text-xs text-slate-500">{resena.autor}</p>
            </article>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
