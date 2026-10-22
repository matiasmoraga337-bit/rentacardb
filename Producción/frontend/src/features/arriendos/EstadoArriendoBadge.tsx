import { cn } from '@/lib/utils';

const ESTILOS: Record<string, string> = {
  ACTIVO: 'bg-sky-50 text-sky-700 ring-sky-200',
  FINALIZADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELADO: 'bg-red-50 text-red-700 ring-red-200',
};

const ETIQUETAS: Record<string, string> = {
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export function EstadoArriendoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        ESTILOS[estado] ?? 'bg-slate-100 text-slate-700 ring-slate-200',
      )}
    >
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
