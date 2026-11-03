import { cn } from '@/lib/utils';

export function HeroCarFallback({ className }: { className?: string }) {
  return (
    <img
      src="/images/hero-car.svg"
      alt=""
      aria-hidden="true"
      className={cn('h-full w-full object-contain', className)}
    />
  );
}
