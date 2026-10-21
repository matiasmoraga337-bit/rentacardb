import { describe, expect, it } from 'vitest';
import { diasEntre, formatearCLP, formatearFecha, puedeCancelar } from '../format';

describe('formatos de reservas', () => {
  it('formatea montos en CLP', () => {
    expect(formatearCLP(24990)).toContain('24.990');
  });

  it('formatea fechas sin desfase de zona horaria', () => {
    expect(formatearFecha('2026-11-10')).toBe('10-11-2026');
  });

  it('calcula los dias entre fechas', () => {
    expect(diasEntre('2026-11-10', '2026-11-14')).toBe(4);
  });

  it('permite cancelar solo en estados iniciales', () => {
    expect(puedeCancelar('PENDIENTE')).toBe(true);
    expect(puedeCancelar('CONFIRMADA')).toBe(true);
    expect(puedeCancelar('COMPLETADA')).toBe(false);
    expect(puedeCancelar('EXPIRADA')).toBe(false);
  });
});
