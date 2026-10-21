export interface CalculoReembolsoInput {
  porcentajeReembolso: number;
  diasAnticipacion: number;
  diasHastaInicio: number;
  montoPagado: number;
  montoReembolsado: number;
}

export interface CalculoReembolsoResult {
  elegible: boolean;
  monto: number;
  disponible: number;
  porcentajeAplicado: number;
}

const redondear2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function calcularReembolso(input: CalculoReembolsoInput): CalculoReembolsoResult {
  const disponible = Math.max(0, redondear2(input.montoPagado - input.montoReembolsado));
  const porcentaje = Math.min(100, Math.max(0, input.porcentajeReembolso));
  const cumpleAnticipacion = input.diasHastaInicio >= Math.max(0, input.diasAnticipacion);

  if (!cumpleAnticipacion || disponible <= 0 || porcentaje <= 0) {
    return { elegible: false, monto: 0, disponible, porcentajeAplicado: 0 };
  }

  const monto = redondear2(Math.min(disponible, (disponible * porcentaje) / 100));
  return { elegible: monto > 0, monto, disponible, porcentajeAplicado: porcentaje };
}
