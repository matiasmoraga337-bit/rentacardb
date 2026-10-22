import sql from 'mssql';
import { getPool } from '../config/db';
import type { CrearResenaInput, TipoResena } from '../schemas/resena.schema';

export interface ResenaRow {
  id: number;
  arriendoId: number;
  tipo: TipoResena;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  autorId: number;
  autor: string;
}

const RESENA_SELECT = `
  SELECT re.ID_resena AS id,
         re.ID_arriendo_resena AS arriendoId,
         tr.nombre_tipo_resena AS tipo,
         re.calificacion_resena AS calificacion,
         re.comentario_resena AS comentario,
         re.fecha_resena AS fecha,
         re.ID_usuario_autor_resena AS autorId,
         CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS autor
  FROM dbo.Resena re
  INNER JOIN dbo.TipoResena tr ON tr.ID_tipo_resena = re.ID_tipo_resena_resena
  INNER JOIN dbo.Usuario u ON u.ID_usuario = re.ID_usuario_autor_resena
  INNER JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
`;

export async function crearResena(
  idUsuarioAutor: number,
  input: CrearResenaInput,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_usuario_autor', sql.Int, idUsuarioAutor)
    .input('ID_arriendo', sql.Int, input.ID_arriendo)
    .input('tipo_resena', sql.VarChar(50), input.tipo_resena)
    .input('calificacion', sql.TinyInt, input.calificacion)
    .input('comentario', sql.NVarChar(1000), input.comentario ?? null)
    .execute('u_sp_CrearResena');
}

export async function obtenerResenaCreada(
  idArriendo: number,
  idAutor: number,
  tipo: TipoResena,
): Promise<ResenaRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idArriendo', sql.Int, idArriendo)
    .input('idAutor', sql.Int, idAutor)
    .input('tipo', sql.VarChar(50), tipo)
    .query<ResenaRow>(
      `${RESENA_SELECT}
       WHERE re.ID_arriendo_resena = @idArriendo
         AND re.ID_usuario_autor_resena = @idAutor
         AND tr.nombre_tipo_resena = @tipo
         AND re.activo_resena = 1
       ORDER BY re.ID_resena DESC`,
    );
  return result.recordset[0] ?? null;
}

export async function existeVehiculo(idVehiculo: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.Vehiculo
       WHERE ID_vehiculo = @id AND fecha_baja_vehiculo IS NULL`,
    );
  return result.recordset.length > 0;
}

export async function listarResenasVehiculo(idVehiculo: number): Promise<ResenaRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<ResenaRow>(
      `${RESENA_SELECT}
       INNER JOIN dbo.Arriendo a ON a.ID_arriendo = re.ID_arriendo_resena
       INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
       WHERE r.ID_vehiculo_reserva = @id
         AND tr.nombre_tipo_resena = 'CLIENTE_A_VEHICULO'
         AND re.activo_resena = 1
       ORDER BY re.fecha_resena DESC, re.ID_resena DESC`,
    );
  return result.recordset;
}

export async function existeProveedor(idProveedor: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idProveedor)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.Proveedor
       WHERE ID_proveedor = @id AND fecha_baja_proveedor IS NULL`,
    );
  return result.recordset.length > 0;
}

export async function listarResenasProveedor(idProveedor: number): Promise<ResenaRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idProveedor)
    .query<ResenaRow>(
      `${RESENA_SELECT}
       INNER JOIN dbo.Arriendo a ON a.ID_arriendo = re.ID_arriendo_resena
       INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       WHERE v.ID_proveedor_vehiculo = @id
         AND tr.nombre_tipo_resena = 'CLIENTE_A_PROVEEDOR'
         AND re.activo_resena = 1
       ORDER BY re.fecha_resena DESC, re.ID_resena DESC`,
    );
  return result.recordset;
}

export async function recalcularCalificacionVehiculo(idArriendo: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_arriendo', sql.Int, idArriendo)
    .execute('u_sp_RecalcularCalificacionVehiculo');
}