import { calcularReembolso } from '../src/services/reembolso-policy';

describe('calcularReembolso', () => {
  it('devuelve el 100% cuando se cumple la anticipacion', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 100,
      diasAnticipacion: 2,
      diasHastaInicio: 10,
      montoPagado: 100000,
      montoReembolsado: 0,
    });
    expect(result).toEqual({
      elegible: true,
      monto: 100000,
      disponible: 100000,
      porcentajeAplicado: 100,
    });
  });

  it('aplica el porcentaje de la politica', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 50,
      diasAnticipacion: 7,
      diasHastaInicio: 8,
      montoPagado: 80000,
      montoReembolsado: 0,
    });
    expect(result.monto).toBe(40000);
  });

  it('no reembolsa si no se cumple la anticipacion', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 100,
      diasAnticipacion: 7,
      diasHastaInicio: 3,
      montoPagado: 80000,
      montoReembolsado: 0,
    });
    expect(result.elegible).toBe(false);
    expect(result.monto).toBe(0);
  });

  it('no reembolsa con politica 0%', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 0,
      diasAnticipacion: 0,
      diasHastaInicio: 30,
      montoPagado: 50000,
      montoReembolsado: 0,
    });
    expect(result.monto).toBe(0);
  });

  it('descuenta reembolsos previos del saldo disponible', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 100,
      diasAnticipacion: 2,
      diasHastaInicio: 10,
      montoPagado: 100000,
      montoReembolsado: 60000,
    });
    expect(result.disponible).toBe(40000);
    expect(result.monto).toBe(40000);
  });

  it('redondea a dos decimales', () => {
    const result = calcularReembolso({
      porcentajeReembolso: 33.33,
      diasAnticipacion: 0,
      diasHastaInicio: 5,
      montoPagado: 10000,
      montoReembolsado: 0,
    });
    expect(result.monto).toBe(3333);
  });
});
