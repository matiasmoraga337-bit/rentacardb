import * as repo from '../repositories/liquidacion.repository';
import * as vehiculoRepo from '../repositories/vehiculo.repository';
import type {
  CrearLiquidacionInput,
  ListarLiquidacionesQuery,
} from '../schemas/liquidacion.schema';
import { AppError } from '../utils/AppError';
import { esFechaValida } from '../utils/dates';

const LIQUIDACION_ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  70500: { status: 400, code: 'PERIODO_INVALIDO', message: 'El periodo de la liquidacion es invalido.' },
  70501: { status: 404, code: 'PROVEEDOR_NO_ENCONTRADO', message: 'Proveedor no encontrado.' },
  70502: {
    status: 409,
    code: 'LIQUIDACION_NO_CALCULADA',
    message: 'La liquidacion no existe o no esta CALCULADA.',
  },
  70503: {
    status: 409,
    code: 'LIQUIDACION_NO_APROBADA',
    message: 'La liquidacion no existe o no esta APROBADA.',
  },
  70504: {
    status: 409,
    code: 'LIQUIDACION_SOLAPADA',
    message: 'Ya existe una liquidacion para un periodo solapado.',
  },
};

function traducirError(error: unknown): never {
  const sqlError = error as { number?: number };
  const mapped = sqlError.number ? LIQUIDACION_ERROR_MAP[sqlError.number] : undefined;
  if (mapped) throw new AppError(mapped.status, mapped.code, mapped.message);
  throw error;
}

async function proveedorDelUsuario(idUsuario: number): Promise<number> {
  const idProveedor = await vehiculoRepo.findProveedorIdByUsuario(idUsuario);
  if (!idProveedor) {
    throw new AppError(403, 'SIN_PROVEEDOR', 'El usuario no tiene un proveedor asociado.');
  }
  return idProveedor;
}

export async function crearLiquidacion(
  idUsuario: number,
  input: CrearLiquidacionInput,
): Promise<repo.LiquidacionRow> {
  if (!esFechaValida(input.periodo_inicio) || !esFechaValida(input.periodo_fin)) {
    throw new AppError(400, 'PERIODO_INVALIDO', 'Las fechas del periodo no son validas.');
  }
  if (input.periodo_fin < input.periodo_inicio) {
    throw new AppError(400, 'PERIODO_INVALIDO', 'La fecha final no puede ser anterior al inicio.');
  }

  try {
    await repo.crearLiquidacion(input, idUsuario);
  } catch (error) {
    traducirError(error);
  }

  const lista = await repo.listarLiquidaciones({
    proveedor: input.ID_proveedor,
    page: 1,
    pageSize: 1,
  });
  const row = lista.rows[0];
  if (!row) {
    throw new AppError(500, 'LIQUIDACION_NO_REGISTRADA', 'No se pudo leer la liquidacion generada.');
  }
  return row;
}

export async function listarLiquidaciones(
  idUsuario: number,
  roles: string[],
  query: ListarLiquidacionesQuery,
): Promise<{ data: repo.LiquidacionRow[]; page: number; pageSize: number; total: number }> {
  const esAdmin = roles.includes('ADMIN');
  const esProveedor = roles.includes('PROVEEDOR') || roles.includes('OPERADOR');
  let idProveedor = query.proveedor;

  if (!esAdmin) {
    if (!esProveedor) {
      throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a liquidaciones.');
    }
    const propio = await proveedorDelUsuario(idUsuario);
    if (idProveedor && idProveedor !== propio) {
      throw new AppError(403, 'FORBIDDEN', 'No puede ver liquidaciones de otro proveedor.');
    }
    idProveedor = propio;
  }

  const { rows, total } = await repo.listarLiquidaciones({
    proveedor: idProveedor,
    estado: query.estado,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { data: rows, page: query.page, pageSize: query.pageSize, total };
}

export async function aprobarLiquidacion(
  idLiquidacion: number,
  idUsuario: number,
): Promise<repo.LiquidacionRow> {
  try {
    await repo.aprobarLiquidacion(idLiquidacion, idUsuario);
  } catch (error) {
    traducirError(error);
  }
  const row = await repo.obtenerLiquidacion(idLiquidacion);
  if (!row) {
    throw new AppError(404, 'LIQUIDACION_NO_ENCONTRADA', 'Liquidacion no encontrada.');
  }
  return row;
}

export async function pagarLiquidacion(
  idLiquidacion: number,
  idUsuario: number,
): Promise<repo.LiquidacionRow> {
  try {
    await repo.pagarLiquidacion(idLiquidacion, idUsuario);
  } catch (error) {
    traducirError(error);
  }
  const row = await repo.obtenerLiquidacion(idLiquidacion);
  if (!row) {
    throw new AppError(404, 'LIQUIDACION_NO_ENCONTRADA', 'Liquidacion no encontrada.');
  }
  return row;
}
