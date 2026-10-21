import sql from 'mssql';
import { getPool } from '../config/db';

export interface CatalogoItem {
  id: number;
  nombre: string;
  extra?: string | number | boolean | null;
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
