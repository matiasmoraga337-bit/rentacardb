import { cn } from '@/lib/utils';

const ESTILOS: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  APROBADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  RECHAZADO: 'bg-red-50 text-red-700 ring-red-200',
  REEMBOLSADO: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function EstadoPagoBadge({ estado }: { estado: string | null }) {
  if (!estado) {
    return <span className="text-xs text-slate-500">Sin pago</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        ESTILOS[estado] ?? 'bg-slate-100 text-slate-700 ring-slate-200',
      )}
    >
      {estado}
    </span>
  );
}
