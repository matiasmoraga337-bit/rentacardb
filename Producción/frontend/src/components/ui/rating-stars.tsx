import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type RatingStarsSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<RatingStarsSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const STARS = [0, 1, 2, 3, 4];

function formatRating(value: number): string {
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

interface RatingStarsProps {
  value: number | null;
  size?: RatingStarsSize;
  label?: string;
  className?: string;
}

export function RatingStars({ value, size = 'sm', label, className }: RatingStarsProps) {
  const rating = value === null ? 0 : Math.min(Math.max(value, 0), 5);
  const percentage = (rating / 5) * 100;
  const accessibleLabel =
    label ?? (value === null ? 'Sin calificacion' : `${formatRating(rating)} de 5 estrellas`);

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={cn('relative inline-flex shrink-0', className)}
    >
      <span className="flex text-slate-300" aria-hidden="true">
        {STARS.map((star) => (
          <Star key={star} className={cn(sizeClasses[size], 'shrink-0')} strokeWidth={1.5} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-500"
        style={{ width: `${percentage}%` }}
        aria-hidden="true"
      >
        {STARS.map((star) => (
          <Star
            key={star}
            className={cn(sizeClasses[size], 'shrink-0 fill-current')}
            strokeWidth={1.5}
          />
        ))}
      </span>
    </span>
  );
}

export { formatRating };
