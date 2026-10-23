import { describe, expect, it } from 'vitest';
import { vehiculosFixture } from '../__fixtures__/worstCase';

describe('vehiculosFixture', () => {
  it('genera los estados vacio, uno y mil', () => {
    expect(vehiculosFixture('empty')).toHaveLength(0);
    expect(vehiculosFixture('one')).toHaveLength(1);
    expect(vehiculosFixture('many')).toHaveLength(1000);
  });

  it('incluye casos de texto largo y precios extremos', () => {
    const worst = vehiculosFixture('worst');
    expect(worst.some((item) => (item.nombre_modelo?.length ?? 0) > 60)).toBe(true);
    expect(worst.some((item) => (item.nombre_comercial_proveedor?.length ?? 0) > 60)).toBe(true);
    expect(worst.some((item) => (item.precio_cotizado ?? 0) > 10000000)).toBe(true);
    expect(worst.some((item) => item.calificacion_promedio_vehiculo === null)).toBe(true);
  });
});
