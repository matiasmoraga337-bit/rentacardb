import * as repo from '../repositories/notificacion.repository';
import { AppError } from '../utils/AppError';

export async function listarNotificaciones(
  idUsuario: number,
  query: { estado?: string; page: number; pageSize: number },
): Promise<{ data: repo.NotificacionRow[]; page: number; pageSize: number; total: number }> {
  const { rows, total } = await repo.listarNotificaciones({
    idUsuario,
    estado: query.estado,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { data: rows, page: query.page, pageSize: query.pageSize, total };
}

export async function contarNoLeidas(idUsuario: number): Promise<{ total: number }> {
  return { total: await repo.contarNoLeidas(idUsuario) };
}

export async function marcarLeida(idNotificacion: number, idUsuario: number): Promise<void> {
  try {
    await repo.marcarLeida(idNotificacion, idUsuario);
  } catch (error) {
    const sqlError = error as { number?: number };
    if (sqlError.number === 60200) {
      throw new AppError(
        404,
        'NOTIFICACION_NO_ENCONTRADA',
        'Notificacion no encontrada, de otro usuario o ya leida.',
      );
    }
    throw error;
  }
}
