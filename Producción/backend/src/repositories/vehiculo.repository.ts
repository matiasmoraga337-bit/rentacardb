import sql from 'mssql';
import { getPool } from '../config/db';

export interface RegistrarVehiculoParams {
  ID_proveedor: number;
  ID_modelo: number;
  ID_tipo_vehiculo: number;
  ID_tipo_combustible: number;
  ID_tipo_transmision: number;
  patente: string;
  vin: string;
  anio: number;
  kilometraje: number;
  precio_diario_base: number;
  ID_sede_actual?: number | null;
}

export interface ActualizarVehiculoParams {
  ID_modelo?: number;
  ID_tipo_vehiculo?: number;
  ID_tipo_combustible?: number;
  ID_tipo_transmision?: number;
  ID_estado_vehiculo?: number;
  ID_sede_actual?: number;
  anio?: number;
  kilometraje?: number;
  precio_diario_base?: number;
}

export interface TarifaParams {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_dia: number;
  prioridad?: number;
  dia_semana?: number;
  anticipacion_min?: number;
  anticipacion_max?: number;
  dias_minimos?: number;
  dias_maximos?: number;
  activa?: boolean;
}

export async function findProveedorIdByUsuario(idUsuario: number): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<{ ID_proveedor_proveedor_usuario: number }>(
      `SELECT TOP 1 ID_proveedor_proveedor_usuario
       FROM ProveedorUsuario WHERE ID_usuario_proveedor_usuario = @id`,
    );
  return result.recordset[0]?.ID_proveedor_proveedor_usuario ?? null;
}

export async function perteneceAProveedor(
  idVehiculo: number,
  idProveedor: number,
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idVehiculo', sql.Int, idVehiculo)
    .input('idProveedor', sql.Int, idProveedor)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM Vehiculo
       WHERE ID_vehiculo = @idVehiculo AND ID_proveedor_vehiculo = @idProveedor`,
    );
  return result.recordset.length > 0;
}

export async function registrarVehiculo(params: RegistrarVehiculoParams): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_proveedor', sql.Int, params.ID_proveedor)
    .input('ID_modelo', sql.Int, params.ID_modelo)
    .input('ID_tipo_vehiculo', sql.Int, params.ID_tipo_vehiculo)
    .input('ID_tipo_combustible', sql.Int, params.ID_tipo_combustible)
    .input('ID_tipo_transmision', sql.Int, params.ID_tipo_transmision)
    .input('patente', sql.VarChar(10), params.patente)
    .input('vin', sql.VarChar(17), params.vin)
    .input('anio', sql.SmallInt, params.anio)
    .input('kilometraje', sql.Int, params.kilometraje)
    .input('precio_diario_base', sql.Decimal(12, 2), params.precio_diario_base)
    .input('ID_sede_actual', sql.Int, params.ID_sede_actual ?? null)
    .execute('u_sp_RegistrarVehiculo');
  return result.recordset[0] ?? null;
}

export async function actualizarVehiculo(
  idVehiculo: number,
  idProveedor: number,
  params: ActualizarVehiculoParams,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_modelo', sql.Int, params.ID_modelo ?? null)
    .input('ID_tipo_vehiculo', sql.Int, params.ID_tipo_vehiculo ?? null)
    .input('ID_tipo_combustible', sql.Int, params.ID_tipo_combustible ?? null)
    .input('ID_tipo_transmision', sql.Int, params.ID_tipo_transmision ?? null)
    .input('ID_estado_vehiculo', sql.Int, params.ID_estado_vehiculo ?? null)
    .input('ID_sede_actual', sql.Int, params.ID_sede_actual ?? null)
    .input('anio', sql.SmallInt, params.anio ?? null)
    .input('kilometraje', sql.Int, params.kilometraje ?? null)
    .input('precio_diario_base', sql.Decimal(12, 2), params.precio_diario_base ?? null)
    .execute('u_sp_ActualizarVehiculo');
  return result.recordset[0] ?? null;
}

export async function publicarVehiculo(idVehiculo: number, idUsuario: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_usuario_admin', sql.Int, idUsuario)
    .execute('u_sp_PublicarVehiculo');
}

const VEHICULO_DETALLE = `
  SELECT v.ID_vehiculo AS id,
         v.patente_vehiculo AS patente,
         v.vin_vehiculo AS vin,
         v.anio_vehiculo AS anio,
         v.kilometraje_vehiculo AS kilometraje,
         v.precio_diario_base_vehiculo AS precioDiario,
         v.ID_proveedor_vehiculo AS idProveedor,
         v.ID_sede_actual_vehiculo AS idSedeActual,
         m.nombre_modelo AS modelo,
         ma.nombre_marca AS marca,
         tv.nombre_tipo_vehiculo AS tipoVehiculo,
         tc.nombre_tipo_combustible AS combustible,
         tt.nombre_tipo_transmision AS transmision,
         ee.nombre_estado_vehiculo AS estadoVehiculo,
         ep.nombre_estado_publicacion_vehiculo AS estadoPublicacion
  FROM Vehiculo v
  INNER JOIN Modelo m ON m.ID_modelo = v.ID_modelo_vehiculo
  INNER JOIN Marca ma ON ma.ID_marca = m.ID_marca_modelo
  INNER JOIN TipoVehiculo tv ON tv.ID_tipo_vehiculo = v.ID_tipo_vehiculo_vehiculo
  INNER JOIN TipoCombustible tc ON tc.ID_tipo_combustible = v.ID_tipo_combustible_vehiculo
  INNER JOIN TipoTransmision tt ON tt.ID_tipo_transmision = v.ID_tipo_transmision_vehiculo
  INNER JOIN EstadoVehiculo ee ON ee.ID_estado_vehiculo = v.ID_estado_vehiculo_vehiculo
  INNER JOIN EstadoPublicacionVehiculo ep ON ep.ID_estado_publicacion_vehiculo = v.ID_estado_publicacion_vehiculo_vehiculo
`;

export async function obtenerVehiculo(idVehiculo: number): Promise<unknown | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query(`${VEHICULO_DETALLE} WHERE v.ID_vehiculo = @id`);
  return result.recordset[0] ?? null;
}

export async function listarVehiculosProveedor(idProveedor: number): Promise<unknown[]> {  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProveedor', sql.Int, idProveedor)
    .query(
      `SELECT v.ID_vehiculo AS id,
              v.patente_vehiculo AS patente,
              v.anio_vehiculo AS anio,
              v.precio_diario_base_vehiculo AS precioDiario,
              m.nombre_modelo AS modelo,
              ma.nombre_marca AS marca,
              ep.nombre_estado_publicacion_vehiculo AS estadoPublicacion,
              ee.nombre_estado_vehiculo AS estadoVehiculo,
              (SELECT COUNT(*) FROM VehiculoFoto f
               WHERE f.ID_vehiculo_vehiculo_foto = v.ID_vehiculo AND f.activo_foto_vehiculo = 1) AS fotos
       FROM Vehiculo v
       INNER JOIN Modelo m ON m.ID_modelo = v.ID_modelo_vehiculo
       INNER JOIN Marca ma ON ma.ID_marca = m.ID_marca_modelo
       INNER JOIN EstadoVehiculo ee ON ee.ID_estado_vehiculo = v.ID_estado_vehiculo_vehiculo
       INNER JOIN EstadoPublicacionVehiculo ep ON ep.ID_estado_publicacion_vehiculo = v.ID_estado_publicacion_vehiculo_vehiculo
       WHERE v.ID_proveedor_vehiculo = @idProveedor
       ORDER BY v.fecha_registro_vehiculo DESC`,
    );
  return result.recordset;
}

export async function listarFotos(idVehiculo: number): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query(
      `SELECT ID_foto_vehiculo AS id, url_foto_vehiculo AS url, es_principal_foto AS esPrincipal
       FROM VehiculoFoto
       WHERE ID_vehiculo_vehiculo_foto = @id AND activo_foto_vehiculo = 1
       ORDER BY es_principal_foto DESC, ID_foto_vehiculo`,
    );
  return result.recordset;
}

export async function contarFotosActivas(idVehiculo: number): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM VehiculoFoto
       WHERE ID_vehiculo_vehiculo_foto = @id AND activo_foto_vehiculo = 1`,
    );
  return result.recordset[0]?.total ?? 0;
}

export async function registrarFoto(
  idVehiculo: number,
  idProveedor: number,
  url: string,
  esPrincipal: boolean,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('url_foto', sql.VarChar(500), url)
    .input('es_principal', sql.Bit, esPrincipal)
    .execute('u_sp_RegistrarVehiculoFoto');
  return result.recordset[0] ?? null;
}

export async function eliminarFoto(idFoto: number, idProveedor: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_foto', sql.Int, idFoto)
    .input('ID_proveedor', sql.Int, idProveedor)
    .execute('u_sp_EliminarVehiculoFoto');
}

export async function listarCaracteristicas(idVehiculo: number): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query(
      `SELECT c.ID_caracteristica_vehiculo AS id,
              c.nombre_caracteristica AS nombre,
              vc.disponible_vehiculo_caracteristica AS disponible
       FROM VehiculoCaracteristica vc
       INNER JOIN CaracteristicaVehiculo c ON c.ID_caracteristica_vehiculo = vc.ID_caracteristica_vehiculo_caracteristica
       WHERE vc.ID_vehiculo_vehiculo_caracteristica = @id`,
    );
  return result.recordset;
}

export async function agregarCaracteristica(
  idVehiculo: number,
  idProveedor: number,
  idCaracteristica: number,
  disponible: boolean,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_caracteristica', sql.Int, idCaracteristica)
    .input('disponible', sql.Bit, disponible)
    .execute('u_sp_AgregarCaracteristicaVehiculo');
  return result.recordset[0] ?? null;
}

export async function quitarCaracteristica(
  idVehiculo: number,
  idProveedor: number,
  idCaracteristica: number,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_caracteristica', sql.Int, idCaracteristica)
    .execute('u_sp_QuitarCaracteristicaVehiculo');
}

export async function listarTarifas(idVehiculo: number): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query(
      `SELECT ID_tarifa AS id, nombre_tarifa AS nombre,
              fecha_inicio_tarifa AS fechaInicio, fecha_fin_tarifa AS fechaFin,
              precio_dia_tarifa AS precioDia, prioridad_tarifa AS prioridad,
              activa_tarifa AS activa
       FROM TarifaVehiculo
       WHERE ID_vehiculo_tarifa = @id AND activa_tarifa = 1
       ORDER BY fecha_inicio_tarifa`,
    );
  return result.recordset;
}

export async function registrarTarifa(
  idVehiculo: number,
  idProveedor: number,
  data: TarifaParams,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('nombre', sql.VarChar(80), data.nombre)
    .input('fecha_inicio', sql.Date, data.fecha_inicio)
    .input('fecha_fin', sql.Date, data.fecha_fin)
    .input('precio_dia', sql.Decimal(14, 2), data.precio_dia)
    .input('prioridad', sql.Int, data.prioridad ?? 1)
    .input('dia_semana', sql.TinyInt, data.dia_semana ?? null)
    .input('anticipacion_min', sql.Int, data.anticipacion_min ?? null)
    .input('anticipacion_max', sql.Int, data.anticipacion_max ?? null)
    .input('dias_minimos', sql.Int, data.dias_minimos ?? null)
    .input('dias_maximos', sql.Int, data.dias_maximos ?? null)
    .input('activa', sql.Bit, data.activa ?? true)
    .execute('u_sp_RegistrarTarifaVehiculo');
  return result.recordset[0] ?? null;
}

export async function actualizarTarifa(
  idTarifa: number,
  idProveedor: number,
  data: Partial<TarifaParams>,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_tarifa', sql.BigInt, idTarifa)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('nombre', sql.VarChar(80), data.nombre ?? null)
    .input('fecha_inicio', sql.Date, data.fecha_inicio ?? null)
    .input('fecha_fin', sql.Date, data.fecha_fin ?? null)
    .input('precio_dia', sql.Decimal(14, 2), data.precio_dia ?? null)
    .input('prioridad', sql.Int, data.prioridad ?? null)
    .input('dia_semana', sql.TinyInt, data.dia_semana ?? null)
    .input('anticipacion_min', sql.Int, data.anticipacion_min ?? null)
    .input('anticipacion_max', sql.Int, data.anticipacion_max ?? null)
    .input('dias_minimos', sql.Int, data.dias_minimos ?? null)
    .input('dias_maximos', sql.Int, data.dias_maximos ?? null)
    .input('activa', sql.Bit, data.activa ?? null)
    .execute('u_sp_ActualizarTarifaVehiculo');
  return result.recordset[0] ?? null;
}

export async function eliminarTarifa(idTarifa: number, idProveedor: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_tarifa', sql.BigInt, idTarifa)
    .input('ID_proveedor', sql.Int, idProveedor)
    .execute('u_sp_EliminarTarifaVehiculo');
}

export async function registrarDocumento(
  idVehiculo: number,
  idTipoDocumento: number,
  numero: string | null,
  fechaEmision: string | null,
  fechaVencimiento: string,
  url: string | null,
): Promise<unknown> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .input('ID_tipo_documento', sql.Int, idTipoDocumento)
    .input('numero_documento', sql.VarChar(50), numero)
    .input('fecha_emision', sql.Date, fechaEmision)
    .input('fecha_vencimiento', sql.Date, fechaVencimiento)
    .input('url_archivo', sql.VarChar(500), url)
    .execute('u_sp_RegistrarDocumentoVehiculo');
  return result.recordset[0] ?? null;
}

export async function listarDocumentos(idVehiculo: number): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query(
      `SELECT d.ID_documento_vehiculo AS id,
              td.nombre_tipo_documento AS tipo,
              d.numero_documento AS numero,
              d.fecha_vencimiento_documento AS vence,
              d.url_archivo_documento AS url,
              d.verificado_documento AS verificado
       FROM DocumentoVehiculo d
       INNER JOIN TipoDocumentoVehiculo td
         ON td.ID_tipo_documento_vehiculo = d.ID_tipo_documento_vehiculo_documento_vehiculo
       WHERE d.ID_vehiculo_documento_vehiculo = @id AND d.activo_documento = 1
       ORDER BY d.fecha_vencimiento_documento`,
    );
  return result.recordset;
}

export interface BusquedaParams {
  fecha_inicio?: string;
  fecha_fin?: string;
  ID_comuna?: number;
  ID_region?: number;
  ID_tipo_vehiculo?: number;
  precio_maximo?: number;
  ID_caracteristica?: number;
  pagina?: number;
  tamano_pagina?: number;
}

export async function buscarVehiculos(params: BusquedaParams): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('fecha_inicio', sql.Date, params.fecha_inicio ?? null)
    .input('fecha_fin', sql.Date, params.fecha_fin ?? null)
    .input('ID_comuna', sql.Int, params.ID_comuna ?? null)
    .input('ID_region', sql.Int, params.ID_region ?? null)
    .input('ID_tipo_vehiculo', sql.Int, params.ID_tipo_vehiculo ?? null)
    .input('precio_maximo', sql.Decimal(14, 2), params.precio_maximo ?? null)
    .input('ID_caracteristica', sql.Int, params.ID_caracteristica ?? null)
    .input('pagina', sql.Int, params.pagina ?? null)
    .input('tamano_pagina', sql.Int, params.tamano_pagina ?? null)
    .execute('u_sp_BuscarVehiculos');
  return result.recordset;
}

export interface SedeVehiculoItem {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  permiteEntrega: boolean;
  permiteDevolucion: boolean;
}

export async function listarSedesVehiculo(idVehiculo: number): Promise<SedeVehiculoItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<SedeVehiculoItem>(
      `SELECT s.ID_sede_proveedor AS id,
              s.nombre_sede_proveedor AS nombre,
              s.direccion_sede_proveedor AS direccion,
              c.nombre_comuna AS comuna,
              vs.disponible_para_entrega_vehiculo_sede AS permiteEntrega,
              vs.disponible_para_devolucion_vehiculo_sede AS permiteDevolucion
       FROM dbo.VehiculoSede vs
       INNER JOIN dbo.SedeProveedor s
         ON s.ID_sede_proveedor = vs.ID_sede_proveedor_vehiculo_sede
       INNER JOIN dbo.Comuna c ON c.ID_comuna = s.ID_comuna_sede_proveedor
       WHERE vs.ID_vehiculo_vehiculo_sede = @id
         AND s.activo_sede_proveedor = 1
       ORDER BY s.nombre_sede_proveedor`,
    );
  return result.recordset;
}

export interface DisponibilidadParams {
  desde: string;
  hasta: string;
}

export interface DisponibilidadRow {
  id: number;
  patente: string;
  disponible: boolean;
  publicado: boolean;
  reservado: boolean;
  bloqueado: boolean;
  mantenimiento: boolean;
  documentosOk: boolean;
  sedesOk: boolean;
  duracionOk: boolean;
  precioDia: number;
  dias: number;
  ivaPorcentaje: number;
  requiereDeposito: boolean;
  deposito: number;
  subtotal: number;
  impuesto: number;
  total: number;
  minutosExpiracion: number | null;
}

export async function consultarDisponibilidad(
  idVehiculo: number,
  params: DisponibilidadParams,
): Promise<DisponibilidadRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .input('desde', sql.Date, params.desde)
    .input('hasta', sql.Date, params.hasta)
    .query<DisponibilidadRow>(
      `SELECT v.ID_vehiculo AS id,
              v.patente_vehiculo AS patente,
              pub.publicado,
              res.reservado,
              blq.bloqueado,
              man.mantenimiento,
              doc.documentosOk,
              sed.sedesOk,
              dur.duracionOk,
              CAST(CASE WHEN pub.publicado = 1 AND res.reservado = 0
                         AND blq.bloqueado = 0 AND man.mantenimiento = 0
                         AND doc.documentosOk = 1 AND sed.sedesOk = 1
                         AND dur.duracionOk = 1
                        THEN 1 ELSE 0 END AS BIT) AS disponible,
              pr.precio AS precioDia,
              d.dias,
              ISNULL(cg.iva_porcentaje_configuracion_global, 19.00) AS ivaPorcentaje,
              CAST(CASE WHEN ISNULL(cp.requiere_deposito_configuracion_proveedor, 0) = 1
                        THEN 1 ELSE 0 END AS BIT) AS requiereDeposito,
              CAST(CASE WHEN ISNULL(cp.requiere_deposito_configuracion_proveedor, 0) = 1
                        THEN ISNULL(cp.monto_deposito_configuracion_proveedor, 0)
                        ELSE 0 END AS DECIMAL(14,2)) AS deposito,
              st.subtotal,
              im.impuesto,
              tot.total,
              cp.minutos_expiracion_reserva_configuracion_proveedor AS minutosExpiracion
       FROM dbo.Vehiculo v
       LEFT JOIN dbo.ConfiguracionProveedor cp
         ON cp.ID_proveedor_configuracion_proveedor = v.ID_proveedor_vehiculo
       LEFT JOIN dbo.ConfiguracionGlobal cg ON cg.ID_configuracion = 1
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1 FROM dbo.vw_VehiculosDisponibles vd WHERE vd.ID_vehiculo = v.ID_vehiculo
         ) THEN 1 ELSE 0 END AS BIT) AS publicado
       ) pub
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1
           FROM dbo.Reserva r
           INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
           WHERE r.ID_vehiculo_reserva = v.ID_vehiculo
             AND er.nombre_estado_reserva IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
             AND CAST(@desde AS DATE) < r.fecha_fin_reserva
             AND CAST(@hasta AS DATE) > r.fecha_inicio_reserva
         ) THEN 1 ELSE 0 END AS BIT) AS reservado
       ) res
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1 FROM dbo.BloqueoVehiculo b
           WHERE b.ID_vehiculo_bloqueo = v.ID_vehiculo
             AND b.activo_bloqueo = 1
             AND CAST(@desde AS DATETIME2) < b.fecha_fin_bloqueo
             AND CAST(@hasta AS DATETIME2) > b.fecha_inicio_bloqueo
         ) THEN 1 ELSE 0 END AS BIT) AS bloqueado
       ) blq
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1 FROM dbo.Mantenimiento m
           WHERE m.ID_vehiculo_mantenimiento = v.ID_vehiculo
             AND m.activo_mantenimiento = 1
             AND (m.fecha_fin_mantenimiento IS NULL
                  OR m.fecha_fin_mantenimiento > CAST(@desde AS DATETIME2))
             AND m.fecha_inicio_mantenimiento < CAST(@hasta AS DATETIME2)
         ) THEN 1 ELSE 0 END AS BIT) AS mantenimiento
       ) man
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1
           FROM dbo.TipoDocumentoVehiculo td
           WHERE td.obligatorio_tipo_documento = 1
             AND td.activo_tipo_documento = 1
             AND NOT EXISTS (
               SELECT 1
               FROM dbo.DocumentoVehiculo dv
               WHERE dv.ID_vehiculo_documento_vehiculo = v.ID_vehiculo
                 AND dv.ID_tipo_documento_vehiculo_documento_vehiculo = td.ID_tipo_documento_vehiculo
                 AND dv.activo_documento = 1
                 AND dv.verificado_documento = 1
                 AND dv.fecha_vencimiento_documento >= @hasta
             )
         ) THEN 0 ELSE 1 END AS BIT) AS documentosOk
       ) doc
       CROSS APPLY (
         SELECT CAST(CASE WHEN EXISTS (
           SELECT 1
           FROM dbo.VehiculoSede vs
           INNER JOIN dbo.SedeProveedor s
             ON s.ID_sede_proveedor = vs.ID_sede_proveedor_vehiculo_sede
           WHERE vs.ID_vehiculo_vehiculo_sede = v.ID_vehiculo
             AND s.activo_sede_proveedor = 1
             AND s.ID_proveedor_sede_proveedor = v.ID_proveedor_vehiculo
             AND vs.disponible_para_entrega_vehiculo_sede = 1
             AND (vs.fecha_inicio_vehiculo_sede IS NULL
                  OR vs.fecha_inicio_vehiculo_sede <= @hasta)
             AND (vs.fecha_fin_vehiculo_sede IS NULL
                  OR vs.fecha_fin_vehiculo_sede >= @desde)
         ) AND EXISTS (
           SELECT 1
           FROM dbo.VehiculoSede vs
           INNER JOIN dbo.SedeProveedor s
             ON s.ID_sede_proveedor = vs.ID_sede_proveedor_vehiculo_sede
           WHERE vs.ID_vehiculo_vehiculo_sede = v.ID_vehiculo
             AND s.activo_sede_proveedor = 1
             AND s.ID_proveedor_sede_proveedor = v.ID_proveedor_vehiculo
             AND vs.disponible_para_devolucion_vehiculo_sede = 1
             AND (vs.fecha_inicio_vehiculo_sede IS NULL
                  OR vs.fecha_inicio_vehiculo_sede <= @hasta)
             AND (vs.fecha_fin_vehiculo_sede IS NULL
                  OR vs.fecha_fin_vehiculo_sede >= @desde)
         ) THEN 1 ELSE 0 END AS BIT) AS sedesOk
       ) sed
       CROSS APPLY (
         SELECT dbo.fn_PrecioAplicable(v.ID_vehiculo, @desde, @hasta) AS precio
       ) pr
       CROSS APPLY (SELECT DATEDIFF(DAY, @desde, @hasta) AS dias) d
       CROSS APPLY (
         SELECT CAST(CASE WHEN (cp.dias_minimos_arriendo_configuracion_proveedor IS NULL
                               OR d.dias >= cp.dias_minimos_arriendo_configuracion_proveedor)
                           AND (cp.dias_maximos_arriendo_configuracion_proveedor IS NULL
                               OR d.dias <= cp.dias_maximos_arriendo_configuracion_proveedor)
                          THEN 1 ELSE 0 END AS BIT) AS duracionOk
       ) dur
       CROSS APPLY (
         SELECT CONVERT(DECIMAL(14,2), ROUND(d.dias * pr.precio, 2)) AS subtotal
       ) st
       CROSS APPLY (
         SELECT CONVERT(DECIMAL(14,2),
                ROUND(d.dias * pr.precio
                      * ISNULL(cg.iva_porcentaje_configuracion_global, 19.00) / 100.0, 2)) AS impuesto
       ) im
       CROSS APPLY (
         SELECT CONVERT(DECIMAL(14,2),
                st.subtotal + im.impuesto
                + CASE WHEN ISNULL(cp.requiere_deposito_configuracion_proveedor, 0) = 1
                       THEN ISNULL(cp.monto_deposito_configuracion_proveedor, 0)
                       ELSE 0 END) AS total
       ) tot
       WHERE v.ID_vehiculo = @id
         AND v.fecha_baja_vehiculo IS NULL`,
    );
  return result.recordset[0] ?? null;
}
