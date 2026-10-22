import sql from 'mssql';
import { getPool } from '../config/db';

export type ScopeArriendos = 'cliente' | 'proveedor' | 'todos';

export interface ListarArriendosParams {
  scope: ScopeArriendos;
  idUsuario: number;
  estado?: string;
  page: number;
  pageSize: number;
}

export interface ArriendoListRow {
  id: number;
  reservaId: number;
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaRetiro: string;
  fechaDevolucion: string | null;
  kmInicial: number;
  kmFinal: number | null;
  combustibleInicial: number;
  combustibleFinal: number | null;
  estado: string;
  estadoReserva: string;
  idSedeRetiro: number;
  idSedeDevolucion: number | null;
  idSedeActual: number | null;
  sedeRetiroReal: string;
  sedeDevolucionReal: string | null;
  proveedorId: number;
  proveedor: string;
  clienteId: number;
  cliente: string;
  emailCliente: string;
}

export interface ArriendoAcceso {
  idArriendo: number;
  idReserva: number;
  idCliente: number;
  idProveedor: number;
  idVehiculo: number;
  estadoArriendo: string;
  estadoReserva: string;
  idSedeActual: number | null;
  idSedeRetiro: number;
  idSedeDevolucion: number | null;
  fechaInicio: string;
  fechaFin: string;
  kmInicial: number;
  combustibleInicial: number;
}

export interface InspeccionRow {
  id: number;
  tipo: string;
  combustible: number;
  kilometraje: number;
  limpieza: string | null;
  observaciones: string | null;
  firmaCliente: boolean;
  fecha: string;
  idOperador: number | null;
}

export interface DanoRow {
  id: number;
  inspeccionId: number;
  inspeccionTipo: string;
  zona: string;
  tipo: string;
  severidad: string;
  descripcion: string | null;
  montoEstimado: number | null;
  fecha: string;
}

export interface CargoRow {
  id: number;
  tipo: string | null;
  concepto: string;
  monto: number;
  estado: string;
  fecha: string;
  observaciones: string | null;
}

export interface ConductorRow {
  id: number;
  idPersona: number;
  rut: string;
  nombre: string;
  numeroLicencia: string | null;
  vencimientoLicencia: string | null;
  activo: boolean;
}

export interface ContratoRow {
  id: number;
  version: number;
  hash: string;
  url: string;
  fecha: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ResenaRow {
  id: number;
  tipo: string;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  autorId: number;
  autor: string;
}

export interface ContratoDatos {
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

const ARRIENDO_SELECT = `
  SELECT a.ID_arriendo AS id,
         a.ID_reserva_arriendo AS reservaId,
         v.ID_vehiculo AS vehiculoId,
         v.patente_vehiculo AS patente,
         ma.nombre_marca AS marca,
         mo.nombre_modelo AS modelo,
         CONVERT(char(10), r.fecha_inicio_reserva, 23) AS fechaInicio,
         CONVERT(char(10), r.fecha_fin_reserva, 23) AS fechaFin,
         a.fecha_hora_retiro_real_arriendo AS fechaRetiro,
         a.fecha_hora_devolucion_real_arriendo AS fechaDevolucion,
         a.kilometraje_inicial_arriendo AS kmInicial,
         a.kilometraje_final_arriendo AS kmFinal,
         a.combustible_inicial_arriendo AS combustibleInicial,
         a.combustible_final_arriendo AS combustibleFinal,
         ea.nombre_estado_arriendo AS estado,
         er.nombre_estado_reserva AS estadoReserva,
         a.ID_sede_retiro_real_arriendo AS idSedeRetiro,
         a.ID_sede_devolucion_real_arriendo AS idSedeDevolucion,
         v.ID_sede_actual_vehiculo AS idSedeActual,
         sr.nombre_sede_proveedor AS sedeRetiroReal,
         sd.nombre_sede_proveedor AS sedeDevolucionReal,
         pr.ID_proveedor AS proveedorId,
         pr.nombre_comercial_proveedor AS proveedor,
         r.ID_usuario_cliente_reserva AS clienteId,
         CONCAT(pe.nombres_persona, ' ', pe.apellido_paterno_persona) AS cliente,
         u.email_usuario AS emailCliente
  FROM dbo.Arriendo a
  INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
  INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
  INNER JOIN dbo.Modelo mo ON mo.ID_modelo = v.ID_modelo_vehiculo
  INNER JOIN dbo.Marca ma ON ma.ID_marca = mo.ID_marca_modelo
  INNER JOIN dbo.Proveedor pr ON pr.ID_proveedor = v.ID_proveedor_vehiculo
  INNER JOIN dbo.EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
  INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
  INNER JOIN dbo.SedeProveedor sr ON sr.ID_sede_proveedor = a.ID_sede_retiro_real_arriendo
  LEFT JOIN dbo.SedeProveedor sd ON sd.ID_sede_proveedor = a.ID_sede_devolucion_real_arriendo
  INNER JOIN dbo.Usuario u ON u.ID_usuario = r.ID_usuario_cliente_reserva
  INNER JOIN dbo.Persona pe ON pe.ID_persona = u.ID_persona_usuario
`;

export async function listarArriendos(
  params: ListarArriendosParams,
): Promise<{ rows: ArriendoListRow[]; total: number }> {
  const pool = await getPool();
  const condiciones: string[] = [];
  const inputs: Record<string, { type: any; value: unknown }> = {};

  if (params.scope === 'cliente') {
    condiciones.push('r.ID_usuario_cliente_reserva = @idUsuario');
    inputs.idUsuario = { type: sql.Int, value: params.idUsuario };
  } else if (params.scope === 'proveedor') {
    condiciones.push(`EXISTS (
      SELECT 1 FROM dbo.ProveedorUsuario pu
      WHERE pu.ID_usuario_proveedor_usuario = @idUsuario
        AND pu.ID_proveedor_proveedor_usuario = v.ID_proveedor_vehiculo
    )`);
    inputs.idUsuario = { type: sql.Int, value: params.idUsuario };
  }
  if (params.estado) {
    condiciones.push('ea.nombre_estado_arriendo = @estado');
    inputs.estado = { type: sql.VarChar(50), value: params.estado };
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;
  const countRequest = pool.request();
  const dataRequest = pool.request();
  for (const [name, input] of Object.entries(inputs)) {
    countRequest.input(name, input.type, input.value);
    dataRequest.input(name, input.type, input.value);
  }
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM dbo.Arriendo a
     INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
     INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
     INNER JOIN dbo.EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
     ${where}`,
  );
  const dataResult = await dataRequest.query<ArriendoListRow>(
    `${ARRIENDO_SELECT}
     ${where}
     ORDER BY a.fecha_hora_retiro_real_arriendo DESC, a.ID_arriendo DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );
  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}

export async function obtenerArriendo(idArriendo: number): Promise<ArriendoListRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ArriendoListRow>(`${ARRIENDO_SELECT} WHERE a.ID_arriendo = @id`);
  return result.recordset[0] ?? null;
}

export async function obtenerAccesoArriendo(
  idArriendo: number,
): Promise<ArriendoAcceso | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ArriendoAcceso>(
      `SELECT a.ID_arriendo AS idArriendo,
              r.ID_reserva AS idReserva,
              r.ID_usuario_cliente_reserva AS idCliente,
              v.ID_proveedor_vehiculo AS idProveedor,
              v.ID_vehiculo AS idVehiculo,
              ea.nombre_estado_arriendo AS estadoArriendo,
              er.nombre_estado_reserva AS estadoReserva,
              v.ID_sede_actual_vehiculo AS idSedeActual,
              a.ID_sede_retiro_real_arriendo AS idSedeRetiro,
              a.ID_sede_devolucion_real_arriendo AS idSedeDevolucion,
              CONVERT(char(10), r.fecha_inicio_reserva, 23) AS fechaInicio,
              CONVERT(char(10), r.fecha_fin_reserva, 23) AS fechaFin,
              a.kilometraje_inicial_arriendo AS kmInicial,
              a.combustible_inicial_arriendo AS combustibleInicial
       FROM dbo.Arriendo a
       INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       INNER JOIN dbo.EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
       INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
       WHERE a.ID_arriendo = @id`,
    );
  return result.recordset[0] ?? null;
}

export async function esProveedorDeUsuario(idUsuario: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.ProveedorUsuario
       WHERE ID_usuario_proveedor_usuario = @id`,
    );
  return result.recordset.length > 0;
}

export async function esProveedorDelVehiculo(
  idProveedor: number,
  idUsuario: number,
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProveedor', sql.Int, idProveedor)
    .input('idUsuario', sql.Int, idUsuario)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.ProveedorUsuario
       WHERE ID_proveedor_proveedor_usuario = @idProveedor
         AND ID_usuario_proveedor_usuario = @idUsuario`,
    );
  return result.recordset.length > 0;
}

export async function obtenerKilometrajeVehiculoPorReserva(
  idReserva: number,
): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<{ kmActual: number }>(
      `SELECT v.kilometraje_vehiculo AS kmActual
       FROM dbo.Reserva r
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       WHERE r.ID_reserva = @id`,
    );
  return result.recordset[0]?.kmActual ?? null;
}
export async function iniciarArriendo(params: {
  ID_reserva: number;
  ID_sede_retiro_real: number;
  kilometraje_inicial: number;
  combustible_inicial: number;
  ID_usuario_operador: number;
}): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_reserva', sql.Int, params.ID_reserva)
    .input('ID_sede_retiro_real', sql.Int, params.ID_sede_retiro_real)
    .input('kilometraje_inicial', sql.Int, params.kilometraje_inicial)
    .input('combustible_inicial', sql.Decimal(5, 2), params.combustible_inicial)
    .input('ID_usuario_operador', sql.Int, params.ID_usuario_operador)
    .execute('u_sp_IniciarArriendo');
  const row = result.recordset[0] as { ID_arriendo: number } | undefined;
  return row?.ID_arriendo ?? null;
}

export async function registrarDevolucion(params: {
  ID_arriendo: number;
  ID_sede_devolucion_real: number;
  kilometraje_final: number;
  combustible_final: number;
  limpieza?: string | null;
  observaciones?: string | null;
  ID_usuario_operador: number;
}): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_arriendo', sql.Int, params.ID_arriendo)
    .input('ID_sede_devolucion_real', sql.Int, params.ID_sede_devolucion_real)
    .input('kilometraje_final', sql.Int, params.kilometraje_final)
    .input('combustible_final', sql.Decimal(5, 2), params.combustible_final)
    .input('limpieza', sql.VarChar(20), params.limpieza ?? null)
    .input('observaciones', sql.NVarChar(1000), params.observaciones ?? null)
    .input('ID_usuario_operador', sql.Int, params.ID_usuario_operador)
    .execute('u_sp_RegistrarDevolucion');
  const row = result.recordset[0] as { ID_arriendo: number } | undefined;
  return row?.ID_arriendo ?? null;
}

export async function registrarDano(params: {
  ID_inspeccion: number;
  zona: string;
  tipo: string;
  severidad: string;
  descripcion?: string | null;
  monto_estimado?: number | null;
}): Promise<unknown | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_inspeccion', sql.Int, params.ID_inspeccion)
    .input('zona', sql.VarChar(50), params.zona)
    .input('tipo', sql.VarChar(50), params.tipo)
    .input('severidad', sql.VarChar(20), params.severidad)
    .input('descripcion', sql.NVarChar(500), params.descripcion ?? null)
    .input('monto_estimado', sql.Decimal(12, 2), params.monto_estimado ?? null)
    .execute('u_sp_RegistrarDanoInspeccion');
  return result.recordset[0] ?? null;
}

export async function registrarConductor(params: {
  ID_arriendo: number;
  ID_persona: number;
  ID_licencia_conducir?: number | null;
}): Promise<unknown | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_arriendo', sql.Int, params.ID_arriendo)
    .input('ID_persona', sql.Int, params.ID_persona)
    .input('ID_licencia_conducir', sql.Int, params.ID_licencia_conducir ?? null)
    .execute('u_sp_RegistrarConductorAdicional');
  return result.recordset[0] ?? null;
}

export async function crearAceptacionContrato(params: {
  ID_arriendo: number;
  hash_contrato: string;
  url_contrato: string;
  ip_aceptacion?: string | null;
  user_agent?: string | null;
  ID_usuario: number;
}): Promise<ContratoRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_arriendo', sql.Int, params.ID_arriendo)
    .input('hash_contrato', sql.Char(64), params.hash_contrato)
    .input('url_contrato', sql.VarChar(500), params.url_contrato)
    .input('ip_aceptacion', sql.VarChar(45), params.ip_aceptacion ?? null)
    .input('user_agent', sql.NVarChar(500), params.user_agent ?? null)
    .input('ID_usuario', sql.Int, params.ID_usuario)
    .execute('u_sp_CrearAceptacionContrato');
  const row = result.recordset[0] as
    | {
        ID_aceptacion_contrato: number;
        version_contrato: number;
        hash_contrato: string;
        url_contrato: string;
        fecha_generacion_aceptacion_contrato_arriendo: string;
        ip_aceptacion: string | null;
        user_agent_aceptacion: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.ID_aceptacion_contrato,
    version: row.version_contrato,
    hash: row.hash_contrato,
    url: row.url_contrato,
    fecha: row.fecha_generacion_aceptacion_contrato_arriendo,
    ip: row.ip_aceptacion,
    userAgent: row.user_agent_aceptacion,
  };
}

export async function listarInspecciones(idArriendo: number): Promise<InspeccionRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<InspeccionRow>(
      `SELECT ID_inspeccion_arriendo AS id,
              tipo_inspeccion AS tipo,
              nivel_combustible_inspeccion AS combustible,
              kilometraje_inspeccion AS kilometraje,
              limpieza_inspeccion AS limpieza,
              observaciones_inspeccion AS observaciones,
              firma_cliente_inspeccion AS firmaCliente,
              fecha_inspeccion AS fecha,
              ID_usuario_operador_inspeccion AS idOperador
       FROM dbo.InspeccionArriendo
       WHERE ID_arriendo_inspeccion_arriendo = @id
       ORDER BY fecha_inspeccion, ID_inspeccion_arriendo`,
    );
  return result.recordset;
}

export async function listarDanos(idArriendo: number): Promise<DanoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<DanoRow>(
      `SELECT d.ID_inspeccion_dano AS id,
              d.ID_inspeccion_arriendo_inspeccion_dano AS inspeccionId,
              i.tipo_inspeccion AS inspeccionTipo,
              d.zona_dano AS zona,
              d.tipo_dano AS tipo,
              d.severidad_dano AS severidad,
              d.descripcion_dano AS descripcion,
              d.monto_estimado_dano AS montoEstimado,
              d.fecha_registro_dano AS fecha
       FROM dbo.InspeccionDano d
       INNER JOIN dbo.InspeccionArriendo i
         ON i.ID_inspeccion_arriendo = d.ID_inspeccion_arriendo_inspeccion_dano
       WHERE i.ID_arriendo_inspeccion_arriendo = @id
         AND d.activo_dano = 1
       ORDER BY d.fecha_registro_dano, d.ID_inspeccion_dano`,
    );
  return result.recordset;
}

export async function listarCargos(idArriendo: number): Promise<CargoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<CargoRow>(
      `SELECT ce.ID_cargo_extra AS id,
              tce.nombre_tipo_cargo_extra AS tipo,
              ce.concepto_cargo_extra AS concepto,
              ce.monto_cargo_extra AS monto,
              ece.nombre_estado_cargo_extra AS estado,
              ce.fecha_registro_cargo_extra AS fecha,
              ce.observaciones_cargo_extra AS observaciones
       FROM dbo.CargoExtra ce
       INNER JOIN dbo.EstadoCargoExtra ece
         ON ece.ID_estado_cargo_extra = ce.ID_estado_cargo_extra_cargo_extra
       LEFT JOIN dbo.TipoCargoExtra tce
         ON tce.ID_tipo_cargo_extra = ce.ID_tipo_cargo_extra_cargo_extra
       WHERE ce.ID_arriendo_cargo_extra = @id
       ORDER BY ce.fecha_registro_cargo_extra, ce.ID_cargo_extra`,
    );
  return result.recordset;
}

export async function listarConductores(idArriendo: number): Promise<ConductorRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ConductorRow>(
      `SELECT ca.ID_conductor_adicional AS id,
              ca.ID_persona_conductor_adicional AS idPersona,
              p.rut_persona AS rut,
              CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS nombre,
              lc.numero_licencia AS numeroLicencia,
              lc.fecha_vencimiento_licencia AS vencimientoLicencia,
              ca.activo_conductor_adicional AS activo
       FROM dbo.ConductorAdicional ca
       INNER JOIN dbo.Persona p ON p.ID_persona = ca.ID_persona_conductor_adicional
       LEFT JOIN dbo.LicenciaConducir lc
         ON lc.ID_licencia_conducir = ca.ID_licencia_conducir_conductor_adicional
       WHERE ca.ID_arriendo_conductor_adicional = @id
         AND ca.activo_conductor_adicional = 1
       ORDER BY ca.ID_conductor_adicional`,
    );
  return result.recordset;
}

export async function obtenerContrato(idArriendo: number): Promise<ContratoRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ContratoRow>(
      `SELECT TOP 1 ID_aceptacion_contrato AS id,
              version_contrato AS version,
              hash_contrato AS hash,
              url_contrato AS url,
              fecha_generacion_aceptacion_contrato_arriendo AS fecha,
              ip_aceptacion AS ip,
              user_agent_aceptacion AS userAgent
       FROM dbo.AceptacionContratoArriendo
       WHERE ID_arriendo_aceptacion = @id
         AND es_vigente_aceptacion_contrato_arriendo = 1
       ORDER BY version_contrato DESC`,
    );
  return result.recordset[0] ?? null;
}

export async function listarResenas(idArriendo: number): Promise<ResenaRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ResenaRow>(
      `SELECT re.ID_resena AS id,
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
       WHERE re.ID_arriendo_resena = @id AND re.activo_resena = 1
       ORDER BY re.fecha_resena`,
    );
  return result.recordset;
}

export async function obtenerDatosContrato(idArriendo: number): Promise<ContratoDatos | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idArriendo)
    .query<ContratoDatos>(
      `SELECT a.ID_arriendo AS idArriendo,
              r.ID_reserva AS idReserva,
              CONCAT(pe.nombres_persona, ' ', pe.apellido_paterno_persona) AS cliente,
              pe.rut_persona AS rutCliente,
              u.email_usuario AS emailCliente,
              ma.nombre_marca AS marca,
              mo.nombre_modelo AS modelo,
              v.patente_vehiculo AS patente,
              pr.nombre_comercial_proveedor AS proveedor,
              sr.nombre_sede_proveedor AS sedeRetiro,
              sd.nombre_sede_proveedor AS sedeDevolucion,
              CONVERT(char(10), r.fecha_inicio_reserva, 23) AS fechaInicio,
              CONVERT(char(10), r.fecha_fin_reserva, 23) AS fechaFin,
              r.monto_total_reserva AS total,
              r.moneda_reserva AS moneda
       FROM dbo.Arriendo a
       INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       INNER JOIN dbo.Modelo mo ON mo.ID_modelo = v.ID_modelo_vehiculo
       INNER JOIN dbo.Marca ma ON ma.ID_marca = mo.ID_marca_modelo
       INNER JOIN dbo.Proveedor pr ON pr.ID_proveedor = v.ID_proveedor_vehiculo
       INNER JOIN dbo.SedeProveedor sr ON sr.ID_sede_proveedor = r.ID_sede_retiro_reserva
       LEFT JOIN dbo.SedeProveedor sd ON sd.ID_sede_proveedor = r.ID_sede_devolucion_reserva
       INNER JOIN dbo.Usuario u ON u.ID_usuario = r.ID_usuario_cliente_reserva
       INNER JOIN dbo.Persona pe ON pe.ID_persona = u.ID_persona_usuario
       WHERE a.ID_arriendo = @id`,
    );
  return result.recordset[0] ?? null;
}

export async function obtenerPersonaPorRut(
  rut: string,
): Promise<{ id: number; rut: string; nombre: string } | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('rut', sql.VarChar(12), rut)
    .query<{ id: number; rut: string; nombre: string }>(
      `SELECT TOP 1 ID_persona AS id,
              rut_persona AS rut,
              CONCAT(nombres_persona, ' ', apellido_paterno_persona) AS nombre
       FROM dbo.Persona
       WHERE REPLACE(REPLACE(UPPER(rut_persona), '.', ''), ' ', '') =
             REPLACE(REPLACE(UPPER(@rut), '.', ''), ' ', '')`,
    );
  return result.recordset[0] ?? null;
}

export async function obtenerLicenciaActivaPersona(idPersona: number): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idPersona)
    .query<{ ID_licencia_conducir: number }>(
      `SELECT TOP 1 ID_licencia_conducir
       FROM dbo.LicenciaConducir
       WHERE ID_persona_licencia_conducir = @id
         AND activa_licencia = 1
         AND verificada_licencia = 1
         AND fecha_vencimiento_licencia >= CAST(GETDATE() AS DATE)
       ORDER BY ID_licencia_conducir DESC`,
    );
  return result.recordset[0]?.ID_licencia_conducir ?? null;
}
export async function obtenerInspeccion(
  idInspeccion: number,
): Promise<{ id: number; idArriendo: number; tipo: string } | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idInspeccion)
    .query<{ id: number; idArriendo: number; tipo: string }>(
      `SELECT ID_inspeccion_arriendo AS id,
              ID_arriendo_inspeccion_arriendo AS idArriendo,
              tipo_inspeccion AS tipo
       FROM dbo.InspeccionArriendo
       WHERE ID_inspeccion_arriendo = @id`,
    );
  return result.recordset[0] ?? null;
}
