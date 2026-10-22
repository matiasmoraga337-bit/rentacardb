import * as repo from '../repositories/catalogo.repository';
import { isCatalogoEditable, isCatalogoValido } from '../repositories/catalogo.repository';
import { schemaDeCatalogo } from '../schemas/catalogo.schema';
import type { CatalogoTipo } from '../schemas/catalogo.schema';
import { AppError } from '../utils/AppError';

const ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  60400: { status: 400, code: 'ACCION_CATALOGO_INVALIDA', message: 'Accion de catalogo invalida.' },
  60401: { status: 400, code: 'NOMBRE_INVALIDO', message: 'El nombre es obligatorio.' },
  60402: { status: 404, code: 'CATALOGO_NO_ENCONTRADO', message: 'Registro de catalogo no encontrado.' },
  60403: { status: 409, code: 'CATALOGO_DUPLICADO', message: 'Ya existe un registro con ese nombre.' },
  60404: { status: 400, code: 'REFERENCIA_INVALIDA', message: 'La referencia del catalogo no existe.' },
  60406: { status: 400, code: 'VALOR_INVALIDO', message: 'Valor de catalogo invalido.' },
};

function traducirError(error: unknown): never {
  const sqlError = error as { number?: number };
  const mapped = sqlError.number ? ERROR_MAP[sqlError.number] : undefined;
  if (mapped) throw new AppError(mapped.status, mapped.code, mapped.message);
  throw error;
}

function validarTipo(tipo: string): CatalogoTipo {
  if (!isCatalogoValido(tipo)) {
    throw new AppError(404, 'CATALOGO_NO_ENCONTRADO', `Catalogo '${tipo}' no existe.`);
  }
  if (!isCatalogoEditable(tipo)) {
    throw new AppError(400, 'CATALOGO_SOLO_LECTURA', `El catalogo '${tipo}' es de solo lectura.`);
  }
  return tipo as CatalogoTipo;
}

function parseBody(tipo: CatalogoTipo, body: unknown): repo.CatalogoWriteInput {
  const parsed = schemaDeCatalogo(tipo).safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Datos invalidos.', parsed.error.flatten());
  }
  return parsed.data as repo.CatalogoWriteInput;
}

export async function listarAdmin(
  tipo: string,
  incluirInactivos: boolean,
): Promise<repo.CatalogoAdminItem[]> {
  if (!isCatalogoValido(tipo)) {
    throw new AppError(404, 'CATALOGO_NO_ENCONTRADO', `Catalogo '${tipo}' no existe.`);
  }
  return repo.listarCatalogoAdmin(tipo, incluirInactivos);
}

export async function crear(tipo: string, body: unknown): Promise<unknown | null> {
  const tipoValido = validarTipo(tipo);
  const input = parseBody(tipoValido, body);
  try {
    return await repo.ejecutarAdminCatalogo(tipoValido, 'CREAR', null, input);
  } catch (error) {
    traducirError(error);
  }
}

export async function actualizar(
  tipo: string,
  id: number,
  body: unknown,
): Promise<unknown | null> {
  const tipoValido = validarTipo(tipo);
  const input = parseBody(tipoValido, body);
  try {
    return await repo.ejecutarAdminCatalogo(tipoValido, 'ACTUALIZAR', id, input);
  } catch (error) {
    traducirError(error);
  }
}

export async function desactivar(tipo: string, id: number): Promise<unknown | null> {
  const tipoValido = validarTipo(tipo);
  try {
    return await repo.ejecutarAdminCatalogo(tipoValido, 'DESACTIVAR', id, {});
  } catch (error) {
    traducirError(error);
  }
}
