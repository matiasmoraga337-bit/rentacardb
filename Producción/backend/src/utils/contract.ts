import { createHash } from 'node:crypto';

export interface ContratoData {
  idArriendo: number;
  idReserva: number;
  cliente: string;
  rutCliente: string;
  emailCliente: string;
  marca: string;
  modelo: string;
  patente: string;
  proveedor: string;
  sedeRetiro: string;
  sedeDevolucion: string | null;
  fechaInicio: string;
  fechaFin: string;
  total: number;
  moneda: string;
}

export function generarContratoTexto(data: ContratoData): string {
  const total = data.total.toLocaleString('es-CL');
  return [
    'CONTRATO DE ARRIENDO DE VEHICULO - RentaCarDB',
    '',
    `Arriendo: #${data.idArriendo}`,
    `Reserva: #${data.idReserva}`,
    '',
    `Cliente: ${data.cliente}`,
    `RUT: ${data.rutCliente}`,
    `Email: ${data.emailCliente}`,
    '',
    `Vehiculo: ${data.marca} ${data.modelo} (${data.patente})`,
    `Proveedor: ${data.proveedor}`,
    `Sede de retiro: ${data.sedeRetiro}`,
    `Sede de devolucion: ${data.sedeDevolucion ?? 'Por definir'}`,
    `Periodo: ${data.fechaInicio} al ${data.fechaFin}`,
    `Total reserva: $${total} ${data.moneda}`,
    '',
    'El cliente declara haber revisado el estado del vehiculo al momento del retiro,',
    'comprometerse a devolverlo en las condiciones pactadas y aceptar las politicas',
    'de combustible, kilometraje y danos informadas por el proveedor.',
    '',
    'Documento generado electronicamente por RentaCarDB.',
  ].join('\n');
}

export function hashContrato(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}
