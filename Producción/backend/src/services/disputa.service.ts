import * as repo from '../repositories/disputa.repository';
import * as arriendoRepo from '../repositories/arriendo.repository';
import type {
  CrearDisputaInput,
  ListarDisputasQuery,
  ResolverDisputaInput,
} from '../schemas/disputa.schema';
import { AppError } from '../utils/AppError';
import { assertAccesoArriendo } from './arriendo.service';

const DISPUTA_ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  60110: {
    status: 409,
    code: 'ARRIENDO_NO_FINALIZADO',
    message: 'Solo se abren disputas sobre un arriendo finalizado.',
  },
  60111: {
    status: 409,
    code: 'DISPUTA_DUPLICADA',
    message: 'Ya existe una disputa abierta para este arriendo.',
  },
  60112: {
    status: 403,
    code: 'AUTOR_NO_CORRESPONDE',
    message: 'El usuario no es parte del arriendo.',
  },
  60113: {
    status: 400,
    code: 'MONTO_INVALIDO',
    message: 'El monto disputado debe ser mayor que cero.',
  },
  60114: {
    status: 400,
    code: 'TIPO_DISPUTA_INVALIDO',
    message: 'El tipo de disputa no es valido.',
  },
  60115: { status: 404, code: 'DISPUTA_NO_ENCONTRADA', message: 'Disputa no encontrada.' },
  60116: { status: 409, code: 'DISPUTA_CERRADA', message: 'La disputa ya esta cerrada.' },
  60117: {
    status: 400,
    code: 'RESOLUCION_REQUERIDA',
    message: 'La resolucion es obligatoria para cerrar la disputa.',
  },
  60118: { status: 400, code: 'ESTADO_INVALIDO', message: 'Estado de disputa invalido.' },
};

function traducirError(error: unknown): never {
  const sqlError = error as { number?: number };
  const mapped = sqlError.number ? DISPUTA_ERROR_MAP[sqlError.number] : undefined;
  if (mapped) throw new AppError(mapped.status, mapped.code, mapped.message);
  throw error;
}

const esAdmin = (roles: string[]): boolean => roles.includes('ADMIN');
const esCliente = (roles: string[]): boolean => roles.includes('CLIENTE');
const esProveedorRol = (roles: string[]): boolean =>
  roles.includes('PROVEEDOR') || roles.includes('OPERADOR');

async function elegirScope(
  idUsuario: number,
  roles: string[],
  solicitado?: repo.ScopeDisputas,
): Promise<repo.ScopeDisputas> {
  if (esAdmin(roles)) return solicitado ?? 'todos';
  if (solicitado === 'todos') {
    throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para ver todas las disputas.');
  }
  if (solicitado === 'cliente') {
    if (esCliente(roles)) return 'cliente';
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene rol CLIENTE.');
  }
  if (solicitado === 'proveedor') {
    if (esProveedorRol(roles) && (await arriendoRepo.esProveedorDeUsuario(idUsuario))) {
      return 'proveedor';
    }
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene un proveedor asociado.');
  }
  if (esCliente(roles)) return 'cliente';
  if (esProveedorRol(roles) && (await arriendoRepo.esProveedorDeUsuario(idUsuario))) {
    return 'proveedor';
  }
  throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene acceso a disputas.');
}

export async function crearDisputa(
  idUsuario: number,
  roles: string[],
  input: CrearDisputaInput,
): Promise<repo.DisputaRow> {
  const acceso = await assertAccesoArriendo(input.ID_arriendo, idUsuario, roles);
  if (acceso.estadoArriendo !== 'FINALIZADO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_FINALIZADO',
      'Solo se abren disputas sobre un arriendo finalizado.',
    );
  }
  const esParte =
    acceso.idCliente === idUsuario ||
    (await arriendoRepo.esProveedorDelVehiculo(acceso.idProveedor, idUsuario));
  if (!esParte) {
    throw new AppError(403, 'AUTOR_NO_CORRESPONDE', 'El usuario no es parte del arriendo.');
  }

  try {
    await repo.crearDisputa(idUsuario, input);
  } catch (error) {
    traducirError(error);
  }
  const row = await repo.obtenerDisputaCreada(input.ID_arriendo, idUsuario);
  if (!row) {
    throw new AppError(500, 'DISPUTA_NO_REGISTRADA', 'No se pudo leer la disputa registrada.');
  }
  return row;
}

export async function listarDisputas(
  idUsuario: number,
  roles: string[],
  query: ListarDisputasQuery,
): Promise<{ data: repo.DisputaRow[]; page: number; pageSize: number; total: number }> {
  const scope = await elegirScope(idUsuario, roles, query.scope);
  const { rows, total } = await repo.listarDisputas({ scope, idUsuario, query });
  return { data: rows, page: query.page, pageSize: query.pageSize, total };
}

export async function obtenerDisputa(
  idDisputa: number,
  idUsuario: number,
  roles: string[],
): Promise<repo.DisputaRow> {
  const row = await repo.obtenerDisputa(idDisputa);
  if (!row) {
    throw new AppError(404, 'DISPUTA_NO_ENCONTRADA', 'Disputa no encontrada.');
  }
  await assertAccesoArriendo(row.arriendoId, idUsuario, roles);
  return row;
}

export async function resolverDisputa(
  idDisputa: number,
  idUsuario: number,
  input: ResolverDisputaInput,
): Promise<repo.DisputaRow> {
  try {
    await repo.resolverDisputa(idDisputa, idUsuario, input);
  } catch (error) {
    traducirError(error);
  }
  const row = await repo.obtenerDisputa(idDisputa);
  if (!row) {
    throw new AppError(404, 'DISPUTA_NO_ENCONTRADA', 'Disputa no encontrada.');
  }
  return row;
}
