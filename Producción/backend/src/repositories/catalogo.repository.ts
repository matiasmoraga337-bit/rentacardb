import sql from 'mssql';
import { getPool } from '../config/db';

export interface CatalogoItem {
  id: number;
  nombre: string;
  extra?: string | number | boolean | null;
}

export interface CatalogoAdminItem {
  id: number;
  nombre: string;
  activo: boolean;
  marcaId?: number;
  categoria?: string;
  descripcion?: string | null;
  obligatorio?: boolean;
  diasAnticipacion?: number;
  porcentajeReembolso?: number;
}

export interface CatalogoWriteInput {
  nombre?: string;
  activo?: boolean;
  ID_marca_modelo?: number;
  categoria?: string;
  descripcion?: string | null;
  obligatorio?: boolean;
  dias_anticipacion?: number;
  porcentaje_reembolso?: number;
}

export interface ComunaItem extends CatalogoItem {
  idProvincia: number;
}

interface CatalogoDef {
  table: string;
  id: string;
  nombre: string;
  activo?: string;
  extra?: string;
}

const CATALOGOS: Record<string, CatalogoDef> = {
  marcas: { table: 'Marca', id: 'ID_marca', nombre: 'nombre_marca', activo: 'activo_marca' },
  modelos: {
    table: 'Modelo',
    id: 'ID_modelo',
    nombre: 'nombre_modelo',
    activo: 'activo_modelo',
  },
  'tipos-vehiculo': {
    table: 'TipoVehiculo',
    id: 'ID_tipo_vehiculo',
    nombre: 'nombre_tipo_vehiculo',
    activo: 'activo_tipo_vehiculo',
  },
  combustibles: {
    table: 'TipoCombustible',
    id: 'ID_tipo_combustible',
    nombre: 'nombre_tipo_combustible',
    activo: 'activo_tipo_combustible',
  },
  transmisiones: {
    table: 'TipoTransmision',
    id: 'ID_tipo_transmision',
    nombre: 'nombre_tipo_transmision',
    activo: 'activo_tipo_transmision',
  },
  caracteristicas: {
    table: 'CaracteristicaVehiculo',
    id: 'ID_caracteristica_vehiculo',
    nombre: 'nombre_caracteristica',
    activo: 'activo_caracteristica',
    extra: 'categoria_caracteristica',
  },
  'tipos-documento': {
    table: 'TipoDocumentoVehiculo',
    id: 'ID_tipo_documento_vehiculo',
    nombre: 'nombre_tipo_documento',
    activo: 'activo_tipo_documento',
    extra: 'obligatorio_tipo_documento',
  },
  'tipos-proveedor': { table: 'TipoProveedor', id: 'ID_tipo_proveedor', nombre: 'nombre_tipo_proveedor' },
  'politicas-cancelacion': {
    table: 'PoliticaCancelacion',
    id: 'ID_politica_cancelacion',
    nombre: 'nombre_politica_cancelacion',
    activo: 'activa_politica_cancelacion',
  },
  'estados-vehiculo': {
    table: 'EstadoVehiculo',
    id: 'ID_estado_vehiculo',
    nombre: 'nombre_estado_vehiculo',
  },
  'estados-publicacion': {
    table: 'EstadoPublicacionVehiculo',
    id: 'ID_estado_publicacion_vehiculo',
    nombre: 'nombre_estado_publicacion_vehiculo',
  },
};

export function isCatalogoValido(tipo: string): boolean {
  return Object.prototype.hasOwnProperty.call(CATALOGOS, tipo);
}

const CATALOGOS_EDITABLES = new Set([
  'marcas',
  'modelos',
  'tipos-vehiculo',
  'combustibles',
  'transmisiones',
  'caracteristicas',
  'tipos-documento',
  'politicas-cancelacion',
]);

export function isCatalogoEditable(tipo: string): boolean {
  return CATALOGOS_EDITABLES.has(tipo);
}

export async function listarCatalogo(tipo: string, filtroMarca?: number): Promise<CatalogoItem[]> {
  const def = CATALOGOS[tipo];
  if (!def) return [];

  const pool = await getPool();
  const request = pool.request();
  const extraSelect = def.extra ? `, ${def.extra} AS extra` : '';
  const where: string[] = [];
  if (def.activo) where.push(`${def.activo} = 1`);
  if (tipo === 'modelos' && filtroMarca) {
    request.input('idMarca', sql.Int, filtroMarca);
    where.push('ID_marca_modelo = @idMarca');
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await request.query<CatalogoItem>(
    `SELECT ${def.id} AS id, ${def.nombre} AS nombre${extraSelect}
     FROM dbo.${def.table} ${whereSql} ORDER BY ${def.nombre}`,
  );
  return result.recordset;
}

export async function listarRegiones(): Promise<CatalogoItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query<CatalogoItem>(
      'SELECT ID_region AS id, nombre_region AS nombre FROM dbo.Region WHERE activo_region = 1 ORDER BY nombre_region',
    );
  return result.recordset;
}

export async function listarProvincias(idRegion: number): Promise<CatalogoItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idRegion', sql.Int, idRegion)
    .query<CatalogoItem>(
      'SELECT ID_provincia AS id, nombre_provincia AS nombre FROM dbo.Provincia WHERE ID_region_provincia = @idRegion AND activo_provincia = 1 ORDER BY nombre_provincia',
    );
  return result.recordset;
}

export async function listarComunasPorProvincia(idProvincia: number): Promise<CatalogoItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProvincia', sql.Int, idProvincia)
    .query<CatalogoItem>(
      'SELECT ID_comuna AS id, nombre_comuna AS nombre FROM dbo.Comuna WHERE ID_provincia_comuna = @idProvincia AND activo_comuna = 1 ORDER BY nombre_comuna',
    );
  return result.recordset;
}

export async function buscarComunas(q: string): Promise<ComunaItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('q', sql.NVarChar(100), `%${q}%`)
    .query<ComunaItem>(
      `SELECT ID_comuna AS id, nombre_comuna AS nombre, ID_provincia_comuna AS idProvincia
       FROM dbo.Comuna WHERE nombre_comuna LIKE @q AND activo_comuna = 1
       ORDER BY nombre_comuna`,
    );
  return result.recordset;
}

const SIMPLE_ADMIN = {
  marcas: { table: 'Marca', id: 'ID_marca', nombre: 'nombre_marca', activo: 'activo_marca' },
  'tipos-vehiculo': {
    table: 'TipoVehiculo',
    id: 'ID_tipo_vehiculo',
    nombre: 'nombre_tipo_vehiculo',
    activo: 'activo_tipo_vehiculo',
  },
  combustibles: {
    table: 'TipoCombustible',
    id: 'ID_tipo_combustible',
    nombre: 'nombre_tipo_combustible',
    activo: 'activo_tipo_combustible',
  },
  transmisiones: {
    table: 'TipoTransmision',
    id: 'ID_tipo_transmision',
    nombre: 'nombre_tipo_transmision',
    activo: 'activo_tipo_transmision',
  },
} as const;

export async function listarCatalogoAdmin(
  tipo: string,
  incluirInactivos: boolean,
): Promise<CatalogoAdminItem[]> {
  const pool = await getPool();
  const simple = SIMPLE_ADMIN[tipo as keyof typeof SIMPLE_ADMIN];
  if (simple) {
    const where = incluirInactivos ? '' : `WHERE ${simple.activo} = 1`;
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ${simple.id} AS id, ${simple.nombre} AS nombre, ${simple.activo} AS activo
       FROM dbo.${simple.table} ${where} ORDER BY ${simple.nombre}`,
    );
    return result.recordset;
  }

  if (tipo === 'modelos') {
    const where = incluirInactivos ? '' : 'WHERE m.activo_modelo = 1';
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT m.ID_modelo AS id, m.nombre_modelo AS nombre, m.activo_modelo AS activo,
              m.ID_marca_modelo AS marcaId
       FROM dbo.Modelo m INNER JOIN dbo.Marca ma ON ma.ID_marca = m.ID_marca_modelo
       ${where} ORDER BY ma.nombre_marca, m.nombre_modelo`,
    );
    return result.recordset;
  }

  if (tipo === 'caracteristicas') {
    const where = incluirInactivos ? '' : 'WHERE activo_caracteristica = 1';
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_caracteristica_vehiculo AS id, nombre_caracteristica AS nombre,
              activo_caracteristica AS activo, categoria_caracteristica AS categoria,
              descripcion_caracteristica AS descripcion
       FROM dbo.CaracteristicaVehiculo ${where} ORDER BY categoria_caracteristica, nombre_caracteristica`,
    );
    return result.recordset;
  }

  if (tipo === 'tipos-documento') {
    const where = incluirInactivos ? '' : 'WHERE activo_tipo_documento = 1';
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_tipo_documento_vehiculo AS id, nombre_tipo_documento AS nombre,
              activo_tipo_documento AS activo, obligatorio_tipo_documento AS obligatorio
       FROM dbo.TipoDocumentoVehiculo ${where} ORDER BY nombre_tipo_documento`,
    );
    return result.recordset;
  }

  if (tipo === 'politicas-cancelacion') {
    const where = incluirInactivos ? '' : 'WHERE activa_politica_cancelacion = 1';
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_politica_cancelacion AS id, nombre_politica_cancelacion AS nombre,
              activa_politica_cancelacion AS activo,
              descripcion_politica_cancelacion AS descripcion,
              dias_anticipacion_reembolso AS diasAnticipacion,
              porcentaje_reembolso AS porcentajeReembolso
       FROM dbo.PoliticaCancelacion ${where} ORDER BY nombre_politica_cancelacion`,
    );
    return result.recordset;
  }

  if (tipo === 'tipos-proveedor') {
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_tipo_proveedor AS id, nombre_tipo_proveedor AS nombre, CAST(1 AS BIT) AS activo
       FROM dbo.TipoProveedor ORDER BY nombre_tipo_proveedor`,
    );
    return result.recordset;
  }

  if (tipo === 'estados-vehiculo') {
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_estado_vehiculo AS id, nombre_estado_vehiculo AS nombre, CAST(1 AS BIT) AS activo
       FROM dbo.EstadoVehiculo ORDER BY nombre_estado_vehiculo`,
    );
    return result.recordset;
  }

  if (tipo === 'estados-publicacion') {
    const result = await pool.request().query<CatalogoAdminItem>(
      `SELECT ID_estado_publicacion_vehiculo AS id, nombre_estado_publicacion_vehiculo AS nombre,
              CAST(1 AS BIT) AS activo
       FROM dbo.EstadoPublicacionVehiculo ORDER BY nombre_estado_publicacion_vehiculo`,
    );
    return result.recordset;
  }

  return [];
}

export async function ejecutarAdminCatalogo(
  tipo: string,
  accion: 'CREAR' | 'ACTUALIZAR' | 'DESACTIVAR',
  id: number | null,
  input: CatalogoWriteInput,
): Promise<unknown | null> {
  const pool = await getPool();
  const simple = SIMPLE_ADMIN[tipo as keyof typeof SIMPLE_ADMIN];
  if (simple) {
    const result = await pool
      .request()
      .input('tipo', sql.VarChar(40), tipo)
      .input('accion', sql.VarChar(20), accion)
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(100), input.nombre ?? '')
      .input('activo', sql.Bit, input.activo ?? null)
      .execute('u_sp_AdminCatalogoSimple');
    return result.recordset[0] ?? null;
  }

  if (tipo === 'modelos') {
    const result = await pool
      .request()
      .input('accion', sql.VarChar(20), accion)
      .input('id', sql.Int, id)
      .input('ID_marca', sql.Int, input.ID_marca_modelo ?? null)
      .input('nombre', sql.NVarChar(100), input.nombre ?? '')
      .input('activo', sql.Bit, input.activo ?? null)
      .execute('u_sp_AdminModelo');
    return result.recordset[0] ?? null;
  }

  if (tipo === 'caracteristicas') {
    const result = await pool
      .request()
      .input('accion', sql.VarChar(20), accion)
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(80), input.nombre ?? '')
      .input('categoria', sql.VarChar(30), input.categoria ?? null)
      .input('descripcion', sql.NVarChar(200), input.descripcion ?? null)
      .input('activo', sql.Bit, input.activo ?? null)
      .execute('u_sp_AdminCaracteristica');
    return result.recordset[0] ?? null;
  }

  if (tipo === 'tipos-documento') {
    const result = await pool
      .request()
      .input('accion', sql.VarChar(20), accion)
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(100), input.nombre ?? '')
      .input('obligatorio', sql.Bit, input.obligatorio ?? null)
      .input('activo', sql.Bit, input.activo ?? null)
      .execute('u_sp_AdminTipoDocumento');
    return result.recordset[0] ?? null;
  }

  if (tipo === 'politicas-cancelacion') {
    const result = await pool
      .request()
      .input('accion', sql.VarChar(20), accion)
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(100), input.nombre ?? '')
      .input('descripcion', sql.NVarChar(300), input.descripcion ?? null)
      .input('dias_anticipacion', sql.Int, input.dias_anticipacion ?? null)
      .input('porcentaje_reembolso', sql.Decimal(5, 2), input.porcentaje_reembolso ?? null)
      .input('activo', sql.Bit, input.activo ?? null)
      .execute('u_sp_AdminPoliticaCancelacion');
    return result.recordset[0] ?? null;
  }

  return null;
}