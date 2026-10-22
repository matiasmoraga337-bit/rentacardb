import * as repo from '../repositories/favorito.repository';
import type { GuardarBusquedaInput } from '../schemas/busqueda.schema';
import { AppError } from '../utils/AppError';
import { esFechaValida } from '../utils/dates';

const ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  60500: { status: 404, code: 'USUARIO_NO_ENCONTRADO', message: 'Usuario no encontrado.' },
  60501: { status: 404, code: 'VEHICULO_NO_ENCONTRADO', message: 'Vehiculo no encontrado.' },
  60502: { status: 400, code: 'FECHAS_INVALIDAS', message: 'Rango de fechas invalido.' },
  60503: { status: 404, code: 'BUSQUEDA_NO_ENCONTRADA', message: 'Busqueda no encontrada.' },
};

function traducirError(error: unknown): never {
  const sqlError = error as { number?: number };
  const mapped = sqlError.number ? ERROR_MAP[sqlError.number] : undefined;
  if (mapped) throw new AppError(mapped.status, mapped.code, mapped.message);
  throw error;
}

export async function listarFavoritos(idUsuario: number): Promise<repo.FavoritoRow[]> {
  return repo.listarFavoritos(idUsuario);
}

export async function agregarFavorito(idUsuario: number, idVehiculo: number): Promise<void> {
  try {
    await repo.agregarFavorito(idUsuario, idVehiculo);
  } catch (error) {
    traducirError(error);
  }
}

export async function quitarFavorito(idUsuario: number, idVehiculo: number): Promise<void> {
  try {
    await repo.quitarFavorito(idUsuario, idVehiculo);
  } catch (error) {
    traducirError(error);
  }
}

export async function listarBusquedas(idUsuario: number): Promise<repo.BusquedaRow[]> {
  return repo.listarBusquedas(idUsuario);
}

export async function crearBusqueda(
  idUsuario: number,
  input: GuardarBusquedaInput,
): Promise<repo.BusquedaRow> {
  if (
    (input.fecha_desde && !esFechaValida(input.fecha_desde)) ||
    (input.fecha_hasta && !esFechaValida(input.fecha_hasta))
  ) {
    throw new AppError(400, 'FECHAS_INVALIDAS', 'Las fechas no existen en el calendario.');
  }
  if (input.fecha_desde && input.fecha_hasta && input.fecha_hasta < input.fecha_desde) {
    throw new AppError(400, 'FECHAS_INVALIDAS', 'La fecha final no puede ser anterior al inicio.');
  }

  try {
    const row = await repo.crearBusqueda(idUsuario, input);
    if (!row) {
      throw new AppError(500, 'BUSQUEDA_NO_REGISTRADA', 'No se pudo leer la busqueda guardada.');
    }
    return row;
  } catch (error) {
    if (error instanceof AppError) throw error;
    traducirError(error);
  }
}

export async function eliminarBusqueda(idBusqueda: number, idUsuario: number): Promise<void> {
  try {
    await repo.eliminarBusqueda(idBusqueda, idUsuario);
  } catch (error) {
    traducirError(error);
  }
}
