import * as repo from '../repositories/resena.repository';
import type { CrearResenaInput } from '../schemas/resena.schema';
import { AppError } from '../utils/AppError';
import { assertAccesoArriendo } from './arriendo.service';

const RESENA_ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  53012: {
    status: 400,
    code: 'CALIFICACION_INVALIDA',
    message: 'La calificacion debe estar entre 1 y 5.',
  },
  53013: {
    status: 400,
    code: 'TIPO_RESENA_INVALIDO',
    message: 'El tipo de resena no es valido.',
  },
  53014: {
    status: 409,
    code: 'ARRIENDO_NO_FINALIZADO',
    message: 'El arriendo no existe o aun no esta finalizado.',
  },
  53015: {
    status: 403,
    code: 'AUTOR_NO_CORRESPONDE',
    message: 'El autor no corresponde al cliente del arriendo.',
  },
  53016: {
    status: 403,
    code: 'AUTOR_NO_VINCULADO',
    message: 'El autor no esta vinculado al proveedor del vehiculo.',
  },
  53017: {
    status: 409,
    code: 'RESENA_DUPLICADA',
    message: 'Ya registraste esta resena para el arriendo.',
  },
};

function traducirErrorSql(error: unknown): never {
  const sqlError = error as { number?: number; message?: string };
  const mapped = sqlError.number ? RESENA_ERROR_MAP[sqlError.number] : undefined;
  if (mapped) {
    throw new AppError(mapped.status, mapped.code, mapped.message);
  }
  throw error;
}

export async function crearResena(
  idUsuario: number,
  roles: string[],
  input: CrearResenaInput,
): Promise<repo.ResenaRow> {
  const acceso = await assertAccesoArriendo(input.ID_arriendo, idUsuario, roles);
  if (acceso.estadoArriendo !== 'FINALIZADO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_FINALIZADO',
      'Solo se puede calificar un arriendo finalizado.',
    );
  }

  if (input.tipo_resena === 'PROVEEDOR_A_CLIENTE') {
    const puedeEvaluarCliente =
      roles.includes('PROVEEDOR') || roles.includes('OPERADOR') || roles.includes('ADMIN');
    if (!puedeEvaluarCliente) {
      throw new AppError(
        403,
        'AUTOR_NO_VINCULADO',
        'Solo el proveedor puede evaluar al cliente.',
      );
    }
  } else if (acceso.idCliente !== idUsuario) {
    throw new AppError(
      403,
      'AUTOR_NO_CORRESPONDE',
      'Solo el cliente del arriendo puede evaluar el vehiculo o al proveedor.',
    );
  }

  try {
    await repo.crearResena(idUsuario, input);
  } catch (error) {
    traducirErrorSql(error);
  }

  const resena = await repo.obtenerResenaCreada(input.ID_arriendo, idUsuario, input.tipo_resena);
  if (!resena) {
    throw new AppError(500, 'RESENA_NO_REGISTRADA', 'No se pudo leer la resena registrada.');
  }
  return resena;
}

export interface ResenasVehiculoResponse {
  total: number;
  promedio: number | null;
  resenas: repo.ResenaRow[];
}

function resumirResenas(resenas: repo.ResenaRow[]): ResenasVehiculoResponse {
  const total = resenas.length;
  const promedio =
    total === 0
      ? null
      : Number(
          (
            resenas.reduce((sum, resena) => sum + resena.calificacion, 0) / total
          ).toFixed(2),
        );
  return { total, promedio, resenas };
}

export async function listarResenasVehiculo(idVehiculo: number): Promise<ResenasVehiculoResponse> {
  if (!(await repo.existeVehiculo(idVehiculo))) {
    throw new AppError(404, 'VEHICULO_NO_ENCONTRADO', 'Vehiculo no encontrado.');
  }
  return resumirResenas(await repo.listarResenasVehiculo(idVehiculo));
}

export async function listarResenasProveedor(
  idProveedor: number,
): Promise<ResenasVehiculoResponse> {
  if (!(await repo.existeProveedor(idProveedor))) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', 'Proveedor no encontrado.');
  }
  return resumirResenas(await repo.listarResenasProveedor(idProveedor));
}
