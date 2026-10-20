import sql from 'mssql';
import { getPool } from '../config/db';
import { AppError } from '../utils/AppError';

export interface ProveedorRow {
  ID_proveedor: number;
  ID_tipo_proveedor_proveedor: number;
  ID_persona_proveedor: number | null;
  ID_estado_proveedor_proveedor: number;
  razon_social_proveedor: string | null;
  nombre_comercial_proveedor: string;
  rut_proveedor: string | null;
  telefono_proveedor: string | null;
  email_proveedor: string | null;
  fecha_registro_proveedor: string;
}

export interface RegistrarProveedorParams {
  ID_tipo_proveedor: number;
  ID_persona_proveedor?: number | null;
  nombre_comercial: string;
  razon_social?: string;
  rut_proveedor?: string;
  telefono?: string;
  email?: string;
}

export interface ConfiguracionParams {
  permite_devolucion_otra_sede?: boolean;
  permite_entrega_domicilio?: boolean;
  permite_retiro_domicilio?: boolean;
  radio_maximo_km?: number;
  minutos_expiracion_reserva?: number;
  edad_minima_arriendo?: number;
  requiere_deposito?: boolean;
  monto_deposito?: number;
  dias_minimos_arriendo?: number;
  dias_maximos_arriendo?: number;
  moneda_operacion?: string;
}

export interface SedeParams {
  ID_comuna: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export async function findPersonaIdByUsuario(idUsuario: number): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<{ ID_persona_usuario: number }>(
      'SELECT ID_persona_usuario FROM Usuario WHERE ID_usuario = @id',
    );
  return result.recordset[0]?.ID_persona_usuario ?? null;
}

export async function findTipoProveedorId(nombre: string): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('nombre', sql.VarChar(50), nombre)
    .query<{ ID_tipo_proveedor: number }>(
      'SELECT ID_tipo_proveedor FROM TipoProveedor WHERE nombre_tipo_proveedor = @nombre',
    );
  return result.recordset[0]?.ID_tipo_proveedor ?? null;
}

export async function registrarProveedor(
  params: RegistrarProveedorParams,
): Promise<ProveedorRow> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_tipo_proveedor', sql.Int, params.ID_tipo_proveedor)
    .input('ID_persona_proveedor', sql.Int, params.ID_persona_proveedor ?? null)
    .input('nombre_comercial', sql.NVarChar(150), params.nombre_comercial)
    .input('razon_social', sql.NVarChar(150), params.razon_social ?? null)
    .input('rut_proveedor', sql.VarChar(12), params.rut_proveedor ?? null)
    .input('telefono', sql.VarChar(20), params.telefono ?? null)
    .input('email', sql.VarChar(150), params.email ?? null)
    .execute<ProveedorRow>('sp_RegistrarProveedor');
  const row = result.recordset[0];
  if (!row) {
    throw new AppError(500, 'PROVEEDOR_NO_CREADO', 'No se pudo crear el proveedor.');
  }
  return row;
}

export async function asignarRol(
  idUsuario: number,
  rol: string,
  idEjecutor: number,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .input('rol', sql.VarChar(50), rol)
    .input('ID_usuario_ejecutor', sql.Int, idEjecutor)
    .execute('sp_AsignarRolUsuario');
}

export async function vincularUsuario(
  idProveedor: number,
  idUsuario: number,
  esAdministrador: boolean,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_usuario', sql.Int, idUsuario)
    .input('es_administrador', sql.Bit, esAdministrador)
    .execute('sp_VincularUsuarioProveedor');
}

export async function aprobarProveedor(idProveedor: number, idAdmin: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_usuario_admin', sql.Int, idAdmin)
    .execute('sp_AprobarProveedor');
}

export async function listarProveedores(estado?: string): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('estado', sql.VarChar(50), estado ?? null)
    .query(
      `SELECT p.ID_proveedor AS id,
              p.nombre_comercial_proveedor AS nombreComercial,
              p.razon_social_proveedor AS razonSocial,
              p.rut_proveedor AS rut,
              p.telefono_proveedor AS telefono,
              p.email_proveedor AS email,
              tp.nombre_tipo_proveedor AS tipo,
              ep.nombre_estado_proveedor AS estado,
              p.fecha_registro_proveedor AS fechaRegistro
       FROM Proveedor p
       INNER JOIN TipoProveedor tp ON tp.ID_tipo_proveedor = p.ID_tipo_proveedor_proveedor
       INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
       WHERE (@estado IS NULL OR ep.nombre_estado_proveedor = @estado)
       ORDER BY p.fecha_registro_proveedor DESC`,
    );
  return result.recordset;
}

const PROVEEDOR_SELECT = `
  SELECT p.ID_proveedor AS id,
         p.nombre_comercial_proveedor AS nombreComercial,
         p.razon_social_proveedor AS razonSocial,
         p.rut_proveedor AS rut,
         p.telefono_proveedor AS telefono,
         p.email_proveedor AS email,
         tp.nombre_tipo_proveedor AS tipo,
         ep.nombre_estado_proveedor AS estado,
         c.permite_devolucion_otra_sede AS permiteDevolucionOtraSede,
         c.permite_entrega_domicilio AS permiteEntregaDomicilio,
         c.permite_retiro_domicilio AS permiteRetiroDomicilio,
         c.radio_maximo_km AS radioMaximoKm,
         c.minutos_expiracion_reserva AS minutosExpiracionReserva,
         c.edad_minima_arriendo AS edadMinimaArriendo,
         c.requiere_deposito AS requiereDeposito,
         c.monto_deposito AS montoDeposito,
         c.dias_minimos_arriendo AS diasMinimosArriendo,
         c.dias_maximos_arriendo AS diasMaximosArriendo,
         c.moneda_operacion AS monedaOperacion
  FROM Proveedor p
  INNER JOIN TipoProveedor tp ON tp.ID_tipo_proveedor = p.ID_tipo_proveedor_proveedor
  INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
  LEFT JOIN ConfiguracionProveedor c ON c.ID_proveedor_configuracion_proveedor = p.ID_proveedor
`;

export async function obtenerProveedor(idProveedor: number): Promise<unknown | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idProveedor)
    .query(`${PROVEEDOR_SELECT} WHERE p.ID_proveedor = @id`);
  return result.recordset[0] ?? null;
}

export async function findProveedorByUsuario(idUsuario: number): Promise<unknown | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idUsuario', sql.Int, idUsuario)
    .query(
      `${PROVEEDOR_SELECT}
       INNER JOIN ProveedorUsuario pu ON pu.ID_proveedor_proveedor_usuario = p.ID_proveedor
       WHERE pu.ID_usuario_proveedor_usuario = @idUsuario`,
    );
  return result.recordset[0] ?? null;
}

export async function esAdmin(idUsuario: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<{ admin: number }>(
      `SELECT TOP 1 1 AS admin
       FROM UsuarioRol ur
       INNER JOIN Rol r ON r.ID_rol = ur.ID_rol_usuario_rol
       WHERE ur.ID_usuario_usuario_rol = @id AND r.nombre_rol = 'ADMIN'`,
    );
  return result.recordset.length > 0;
}

export async function esProveedorDeUsuario(
  idProveedor: number,
  idUsuario: number,
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProveedor', sql.Int, idProveedor)
    .input('idUsuario', sql.Int, idUsuario)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM ProveedorUsuario
       WHERE ID_proveedor_proveedor_usuario = @idProveedor
         AND ID_usuario_proveedor_usuario = @idUsuario`,
    );
  return result.recordset.length > 0;
}

export async function actualizarConfiguracion(
  idProveedor: number,
  data: ConfiguracionParams,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('permite_devolucion_otra_sede', sql.Bit, data.permite_devolucion_otra_sede ?? null)
    .input('permite_entrega_domicilio', sql.Bit, data.permite_entrega_domicilio ?? null)
    .input('permite_retiro_domicilio', sql.Bit, data.permite_retiro_domicilio ?? null)
    .input('radio_maximo_km', sql.Decimal(8, 2), data.radio_maximo_km ?? null)
    .input('minutos_expiracion_reserva', sql.Int, data.minutos_expiracion_reserva ?? null)
    .input('edad_minima_arriendo', sql.Int, data.edad_minima_arriendo ?? null)
    .input('requiere_deposito', sql.Bit, data.requiere_deposito ?? null)
    .input('monto_deposito', sql.Decimal(14, 2), data.monto_deposito ?? null)
    .input('dias_minimos_arriendo', sql.Int, data.dias_minimos_arriendo ?? null)
    .input('dias_maximos_arriendo', sql.Int, data.dias_maximos_arriendo ?? null)
    .input('moneda_operacion', sql.Char(3), data.moneda_operacion ?? null)
    .execute('sp_ActualizarConfiguracionProveedor');
  return result.recordset[0] ?? null;
}

export async function listarSedes(idProveedor: number): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProveedor', sql.Int, idProveedor)
    .query(
      `SELECT s.ID_sede_proveedor AS id,
              s.nombre_sede_proveedor AS nombre,
              s.direccion_sede_proveedor AS direccion,
              s.telefono_sede_proveedor AS telefono,
              s.email_sede_proveedor AS email,
              s.activo_sede_proveedor AS activo,
              s.ID_comuna_sede_proveedor AS idComuna,
              c.nombre_comuna AS comuna
       FROM SedeProveedor s
       INNER JOIN Comuna c ON c.ID_comuna = s.ID_comuna_sede_proveedor
       WHERE s.ID_proveedor_sede_proveedor = @idProveedor
       ORDER BY s.nombre_sede_proveedor`,
    );
  return result.recordset;
}

export async function registrarSede(
  idProveedor: number,
  data: SedeParams,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_comuna', sql.Int, data.ID_comuna)
    .input('nombre', sql.NVarChar(100), data.nombre)
    .input('direccion', sql.NVarChar(200), data.direccion)
    .input('telefono', sql.VarChar(20), data.telefono ?? null)
    .input('email', sql.VarChar(150), data.email ?? null)
    .input('activo', sql.Bit, data.activo ?? true)
    .execute('sp_RegistrarSedeProveedor');
  return result.recordset[0] ?? null;
}

export async function actualizarSede(
  idProveedor: number,
  idSede: number,
  data: Partial<SedeParams>,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_sede', sql.Int, idSede)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_comuna', sql.Int, data.ID_comuna ?? null)
    .input('nombre', sql.NVarChar(100), data.nombre ?? null)
    .input('direccion', sql.NVarChar(200), data.direccion ?? null)
    .input('telefono', sql.VarChar(20), data.telefono ?? null)
    .input('email', sql.VarChar(150), data.email ?? null)
    .input('activo', sql.Bit, data.activo ?? null)
    .execute('sp_ActualizarSedeProveedor');
  return result.recordset[0] ?? null;
}

export async function eliminarSede(idProveedor: number, idSede: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_sede', sql.Int, idSede)
    .input('ID_proveedor', sql.Int, idProveedor)
    .execute('sp_EliminarSedeProveedor');
}
