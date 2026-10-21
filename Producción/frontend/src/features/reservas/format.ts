export const formatearCLP = (value: number): string =>
  `$${Math.round(value).toLocaleString('es-CL')}`;

export function formatearFecha(value: string | null | undefined): string {
  if (!value) return '—';
  const soloFecha = value.slice(0, 10);
  const [anio, mes, dia] = soloFecha.split('-').map(Number);
  if (!anio || !mes || !dia) return soloFecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL');
}

export function formatearFechaHora(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const puedeCancelar = (estado: string): boolean =>
  estado === 'PENDIENTE' || estado === 'CONFIRMADA';

const ETIQUETAS_ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
};

export const etiquetaEstado = (estado: string): string => ETIQUETAS_ESTADO[estado] ?? estado;

export function diasEntre(desde: string, hasta: string): number {
  const inicio = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return 0;
  return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 86400000));
}

export function fechaFutura(dias: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dias);
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}
