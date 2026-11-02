import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalendarioIntervalo } from '@/features/vehiculos/api';

interface CalendarioRangoProps {
  desde: string;
  hasta: string;
  min?: string;
  intervalos: CalendarioIntervalo[];
  onChange: (desde: string, hasta: string) => void;
}

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sáb', 'Dom'];

function keyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function expandirBloqueados(intervalos: CalendarioIntervalo[]): Set<string> {
  const set = new Set<string>();
  for (const intervalo of intervalos) {
    if (!intervalo.desde || !intervalo.hasta) continue;
    const start = parseKey(intervalo.desde);
    const end = parseKey(intervalo.hasta);
    for (let cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
      set.add(keyOf(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    }
  }
  return set;
}

export function CalendarioRango({ desde, hasta, min, intervalos, onChange }: CalendarioRangoProps) {
  const minimo = min ?? keyOf(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const [mes, setMes] = useState(() => {
    const base = desde ? parseKey(desde) : parseKey(minimo);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const bloqueados = useMemo(() => expandirBloqueados(intervalos), [intervalos]);
  const year = mes.getFullYear();
  const month = mes.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; key: string } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return { day, key: keyOf(year, month, day) };
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(mes);
  const minMonth = parseKey(minimo);
  const canGoPrev = new Date(year, month, 1) > new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);

  const elegir = (key: string): void => {
    if (!desde || (desde && hasta)) {
      onChange(key, '');
      return;
    }
    if (key <= desde) {
      onChange(key, '');
      return;
    }
    onChange(desde, key);
  };

  const isSelected = (key: string): boolean => key === desde || key === hasta;
  const isInRange = (key: string): boolean => Boolean(desde && hasta && key > desde && key < hasta);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="icon" aria-label="Mes anterior" disabled={!canGoPrev} onClick={() => setMes((current) => addMonths(current, -1))}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p className="text-sm font-semibold capitalize text-slate-900" aria-live="polite">{monthLabel}</p>
        <Button type="button" variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setMes((current) => addMonths(current, 1))}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        {DIAS.map((dia) => <span key={dia} className="py-1">{dia}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Calendario de disponibilidad">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />;
          const past = cell.key < minimo;
          const blocked = bloqueados.has(cell.key);
          const selected = isSelected(cell.key);
          const inRange = isInRange(cell.key);
          const disabled = past || blocked;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              aria-label={`${cell.key}${blocked ? ', no disponible' : past ? ', fecha pasada' : ''}`}
              aria-pressed={selected}
              onClick={() => elegir(cell.key)}
              className={cn(
                'relative aspect-square rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                past && 'cursor-not-allowed text-slate-300',
                !past && !blocked && 'text-slate-700 hover:bg-teal-50',
                blocked && 'cursor-not-allowed bg-red-50 text-red-400 line-through',
                inRange && 'bg-teal-50 text-teal-800',
                selected && 'bg-brand text-white shadow-sm hover:bg-brand',
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200" />No disponible</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-brand" />Seleccionado</span>
        <span className="ml-auto">Toca inicio y fin</span>
      </div>
    </div>
  );
}
