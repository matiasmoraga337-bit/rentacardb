import * as repo from '../repositories/reserva.repository';
import {
  type CambiarEstadoReservaInput,
  type CancelarReservaInput,
  type CrearReservaInput,
  type ListarReservasQuery,
} from '../schemas/reserva.schema';
import { AppError } from '../utils/AppError';
import { calcularReembolso } from './reembolso-policy';

export interface ReservaDto {
  id: number;
  idCliente: number;
  fechaInicio: string;
  fechaFin: string;
  precioDia: number;
  porcentajeImpuesto: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  cliente: string;
  emailCliente: string;
  vehiculoId: number;
  patente: string;
  modelo: string;
  marca: string;
  proveedorId: number;
  proveedor: string;
  sedeRetiro: string;
  sedeDevolucion: string;
  estado: string;
  arriendoId: number | null;
  estadoArriendo: string | null;
  resenado: boolean;
  estadoPago: string | null;
  metodoPago: string | null;
  tipoOperacionPago: string | null;
  montoPago: number | null;
  fechaPago: string | null;
  fechaReserva: string;
  fechaExpiracion: string | null;
  observaciones: string | null;
}

export function mapReserva(row: repo.ReservaViewRow): ReservaDto {
  return {
    id: row.ID_reserva,
    idCliente: row.ID_usuario_cliente_reserva,
    fechaInicio: row.fecha_inicio_reserva,
    fechaFin: row.fecha_fin_reserva,
    precioDia: row.precio_diario_aplicado_reserva,
    porcentajeImpuesto: row.porcentaje_impuesto_aplicado_reserva,
    subtotal: row.monto_subtotal_reserva,
    descuento: row.monto_descuento_reserva,
    impuesto: row.monto_impuesto_reserva,
    total: row.monto_total_reserva,
    cliente: row.nombre_cliente,
    emailCliente: row.email_usuario,
    vehiculoId: row.ID_vehiculo,
    patente: row.patente_vehiculo,
    modelo: row.nombre_modelo,
    marca: row.nombre_marca,
    proveedorId: row.ID_proveedor,
    proveedor: row.nombre_comercial_proveedor,
    sedeRetiro: row.sede_retiro,
    sedeDevolucion: row.sede_devolucion,
    estado: row.nombre_estado_reserva,
    arriendoId: row.ID_arriendo,
    estadoArriendo: row.estado_arriendo,
    resenado: Boolean(row.resenado),
    estadoPago: row.nombre_estado_pago,
    metodoPago: row.nombre_metodo_pago,
    tipoOperacionPago: row.nombre_tipo_operacion_pago,
    montoPago: row.monto_pago,
    fechaPago: row.fecha_pago,
    fechaReserva: row.fecha_reserva,
    fechaExpiracion: row.fecha_expiracion_reserva,
    observaciones: row.observaciones_reserva,
  };
}

const esAdmin = (roles: string[]): boolean => roles.includes('ADMIN');
const esCliente = (roles: string[]): boolean => roles.includes('CLIENTE');
const esProveedorRol = (roles: string[]): boolean =>
  roles.includes('PROVEEDOR') || roles.includes('OPERADOR');

async function elegirScope(
  idUsuario: number,
  roles: string[],
  solicitado?: repo.ScopeReservas,
): Promise<repo.ScopeReservas> {
  if (esAdmin(roles)) {
    if (solicitado === 'cliente' || solicitado === 'proveedor') return solicitado;
    return 'todos';
  }

  if (solicitado === 'todos') {
    throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para ver todas las reservas.');
  }
  if (solicitado === 'cliente') {
    if (esCliente(roles)) return 'cliente';
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene rol CLIENTE.');
  }
  if (solicitado === 'proveedor') {
    if (esProveedorRol(roles) && (await repo.esProveedorDeUsuario(idUsuario))) return 'proveedor';
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene un proveedor asociado.');
  }

  if (esCliente(roles)) return 'cliente';
  if (esProveedorRol(roles) && (await repo.esProveedorDeUsuario(idUsuario))) return 'proveedor';
  throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene acceso a reservas.');
}

export async function crearReserva(
  idUsuario: number,
  input: CrearReservaInput,
  idempotencyKey: string,
): Promise<ReservaDto> {
  const row = await repo.crearReserva({
    ID_usuario_cliente: idUsuario,
    ID_vehiculo: input.ID_vehiculo,
    ID_sede_retiro: input.ID_sede_retiro,
    ID_sede_devolucion: input.ID_sede_devolucion,
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin,
    observaciones: input.observaciones ?? null,
    politica_combustible: input.politica_combustible ?? 'MISMO_NIVEL',
    km_incluidos_dia: input.km_incluidos_dia ?? null,
    cargo_km_excedido: input.cargo_km_excedido ?? null,
    idempotency_key: idempotencyKey,
  });
  if (!row) {
    throw new AppError(500, 'RESERVA_NO_CREADA', 'No se pudo crear la reserva.');
  }
  const view = await repo.obtenerReservaView(row.ID_reserva);
  return mapReserva(view ?? row);
}

export async function listarReservas(
  idUsuario: number,
  roles: string[],
  query: ListarReservasQuery,
): Promise<{ data: ReservaDto[]; page: number; pageSize: number; total: number }> {
  const scope = await elegirScope(idUsuario, roles, query.scope);
  const { rows, total } = await repo.listarReservas({
    scope,
    idUsuario,
    estado: query.estado,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { data: rows.map(mapReserva), page: query.page, pageSize: query.pageSize, total };
}

export async function assertAccesoReserva(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<repo.ReservaAcceso> {
  const acceso = await repo.obtenerAccesoReserva(idReserva);
  if (!acceso) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  if (esAdmin(roles)) return acceso;
  if (esCliente(roles) && acceso.idCliente === idUsuario) return acceso;
  if (esProveedorRol(roles) && (await repo.esProveedorDelVehiculo(acceso.idProveedor, idUsuario))) {
    return acceso;
  }
  throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a esta reserva.');
}

export async function obtenerReserva(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<ReservaDto & { reembolsos: repo.ReembolsoRow[] }> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  const row = await repo.obtenerReservaView(idReserva);
  if (!row) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  const reembolsos = await repo.listarReembolsosReserva(idReserva);
  return { ...mapReserva(row), reembolsos };
}

export async function historialReserva(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<repo.HistorialRow[]> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  return repo.listarHistorial(idReserva);
}

export async function snapshotReserva(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<repo.SnapshotRow[]> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  return repo.listarSnapshots(idReserva);
}

export interface PrevisionCancelacion {
  politica: string;
  descripcion: string | null;
  diasAnticipacion: number;
  porcentajeReembolso: number;
  diasHastaInicio: number;
  montoPagado: number;
  montoReembolsado: number;
  disponible: number;
  elegible: boolean;
  montoReembolso: number;
  estado: string;
}

async function calcularPrevision(idReserva: number): Promise<PrevisionCancelacion> {
  const info = await repo.obtenerCancelacionInfo(idReserva);
  if (!info) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  const porcentaje = info.porcentajeReembolso ?? 0;
  const diasAnticipacion = info.diasAnticipacion ?? 0;
  const calculo = calcularReembolso({
    porcentajeReembolso: porcentaje,
    diasAnticipacion,
    diasHastaInicio: info.diasHastaInicio,
    montoPagado: info.pagado,
    montoReembolsado: info.reembolsado,
  });
  return {
    politica: info.politica ?? 'SIN_POLITICA',
    descripcion: info.descripcionPolitica,
    diasAnticipacion,
    porcentajeReembolso: porcentaje,
    diasHastaInicio: info.diasHastaInicio,
    montoPagado: info.pagado,
    montoReembolsado: info.reembolsado,
    disponible: calculo.disponible,
    elegible: calculo.elegible,
    montoReembolso: calculo.monto,
    estado: info.estado,
  };
}

export async function previsualizarCancelacion(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<PrevisionCancelacion> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  return calcularPrevision(idReserva);
}

export async function cancelarReserva(
  idReserva: number,
  idUsuario: number,
  roles: string[],
  input: CancelarReservaInput,
  idempotencyKey: string | null,
): Promise<{
  reserva: ReservaDto;
  reembolso: repo.ReembolsoRow | null;
  montoReembolsado: number;
  fueIdempotente: boolean;
}> {
  const acceso = await assertAccesoReserva(idReserva, idUsuario, roles);
  if (!esAdmin(roles) && acceso.idCliente !== idUsuario) {
    throw new AppError(403, 'FORBIDDEN', 'Solo el cliente propietario puede cancelar la reserva.');
  }
  if (!['PENDIENTE', 'CONFIRMADA', 'CANCELADA'].includes(acceso.estado)) {
    throw new AppError(
      409,
      'RESERVA_NO_CANCELABLE',
      `La reserva no se puede cancelar desde el estado ${acceso.estado}.`,
    );
  }

  let montoReembolso: number | null = null;
  if (input.solicitar_reembolso) {
    if (acceso.estado === 'CANCELADA') {
      const reembolsos = await repo.listarReembolsosReserva(idReserva);
      if (!reembolsos[0]) {
        throw new AppError(
          409,
          'REEMBOLSO_NO_EXISTE',
          'La reserva ya estaba cancelada y no tiene un reembolso asociado.',
        );
      }
      montoReembolso = reembolsos[0].monto;
    } else {
      const prevision = await calcularPrevision(idReserva);
      if (prevision.montoReembolso > 0) {
        montoReembolso = prevision.montoReembolso;
      }
    }
  }

  if (montoReembolso !== null && !idempotencyKey) {
    throw new AppError(
      400,
      'IDEMPOTENCY_KEY_REQUIRED',
      'Se requiere Idempotency-Key cuando se solicita reembolso.',
    );
  }

  const usuarioPropietario = esAdmin(roles) ? acceso.idCliente : idUsuario;
  const { row, fueIdempotente } = await repo.cancelarReserva({
    ID_reserva: idReserva,
    ID_usuario: usuarioPropietario,
    motivo: input.motivo,
    monto_reembolso: montoReembolso,
    motivo_reembolso: input.motivo_reembolso ?? input.motivo,
    idempotency_key: idempotencyKey,
    referencia_externa: input.referencia_externa ?? null,
  });
  if (!row) {
    throw new AppError(500, 'CANCELACION_FALLIDA', 'No se pudo cancelar la reserva.');
  }
  const view = await repo.obtenerReservaView(idReserva);
  if (!view) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  const reembolsos = await repo.listarReembolsosReserva(idReserva);
  return {
    reserva: mapReserva(view),
    reembolso: reembolsos[0] ?? null,
    montoReembolsado: reembolsos[0]?.monto ?? 0,
    fueIdempotente,
  };
}

const EVENTO_POR_ESTADO: Record<string, string> = {
  CONFIRMADA: 'CONFIRMAR',
  CANCELADA: 'CANCELAR',
  EXPIRADA: 'EXPIRAR',
};

export async function cambiarEstadoReserva(
  idReserva: number,
  idUsuario: number,
  input: CambiarEstadoReservaInput,
): Promise<ReservaDto> {
  if (input.estado === 'CANCELADA' && (await repo.existePagoAprobadoReserva(idReserva))) {
    throw new AppError(
      409,
      'USE_CANCELAR_CON_REEMBOLSO',
      'La reserva tiene pago aprobado; usa /reservas/:id/cancelar para gestionar el reembolso.',
    );
  }
  const evento = EVENTO_POR_ESTADO[input.estado];
  await repo.cambiarEstadoReserva(
    idReserva,
    input.estado,
    evento,
    idUsuario,
    input.motivo ?? null,
  );
  const row = await repo.obtenerReservaView(idReserva);
  if (!row) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  return mapReserva(row);
}

export async function expirarReservas(): Promise<{ message: string }> {
  await repo.expirarReservas();
  return { message: 'Proceso de expiracion de reservas ejecutado.' };
}
