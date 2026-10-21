import { cn } from '@/lib/utils';
import { etiquetaEstado } from './format';

const ESTILOS: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  EN_CURSO: 'bg-sky-50 text-sky-700 ring-sky-200',
  COMPLETADA: 'bg-slate-100 text-slate-700 ring-slate-200',
  CANCELADA: 'bg-red-50 text-red-700 ring-red-200',
  EXPIRADA: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function EstadoReservaBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        ESTILOS[estado] ?? 'bg-slate-100 text-slate-700 ring-slate-200',
      )}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}
