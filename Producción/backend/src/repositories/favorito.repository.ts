import sql from 'mssql';
import { getPool } from '../config/db';
import type { GuardarBusquedaInput } from '../schemas/busqueda.schema';

export interface FavoritoRow {
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  precioDiario: number;
  proveedor: string;
  comuna: string | null;
  region: string | null;
  calificacion: number | null;
  fotoUrl: string | null;
  fecha: string;
}

export interface BusquedaRow {
  id: number;
  nombre: string | null;
  idComuna: number | null;
  idRegion: number | null;
  idTipoVehiculo: number | null;
  precioMaximo: number | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  fechaCreacion: string;
}

export async function listarFavoritos(idUsuario: number): Promise<FavoritoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<FavoritoRow>(
      `SELECT v.ID_vehiculo AS vehiculoId,
              v.patente_vehiculo AS patente,
              ma.nombre_marca AS marca,
              mo.nombre_modelo AS modelo,
              v.anio_vehiculo AS anio,
              v.precio_diario_base_vehiculo AS precioDiario,
              pr.nombre_comercial_proveedor AS proveedor,
              c.nombre_comuna AS comuna,
              r.nombre_region AS region,
              v.calificacion_promedio_vehiculo AS calificacion,
              foto.url AS fotoUrl,
              f.fecha_favorito AS fecha
       FROM dbo.FavoritoVehiculo f
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = f.ID_vehiculo_favorito
       INNER JOIN dbo.Modelo mo ON mo.ID_modelo = v.ID_modelo_vehiculo
       INNER JOIN dbo.Marca ma ON ma.ID_marca = mo.ID_marca_modelo
       INNER JOIN dbo.Proveedor pr ON pr.ID_proveedor = v.ID_proveedor_vehiculo
       LEFT JOIN dbo.SedeProveedor s ON s.ID_sede_proveedor = v.ID_sede_actual_vehiculo
       LEFT JOIN dbo.Comuna c ON c.ID_comuna = s.ID_comuna_sede_proveedor
       LEFT JOIN dbo.Provincia p ON p.ID_provincia = c.ID_provincia_comuna
       LEFT JOIN dbo.Region r ON r.ID_region = p.ID_region_provincia
       OUTER APPLY (
         SELECT TOP 1 url_foto_vehiculo AS url
         FROM dbo.VehiculoFoto
         WHERE ID_vehiculo_vehiculo_foto = v.ID_vehiculo AND activo_foto_vehiculo = 1
         ORDER BY es_principal_foto DESC, ID_foto_vehiculo
       ) foto
       WHERE f.ID_usuario_favorito = @id
       ORDER BY f.fecha_favorito DESC`,
    );
  return result.recordset;
}

export async function agregarFavorito(idUsuario: number, idVehiculo: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .execute('u_sp_AgregarFavorito');
}

export async function quitarFavorito(idUsuario: number, idVehiculo: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .input('ID_vehiculo', sql.Int, idVehiculo)
    .execute('u_sp_QuitarFavorito');
}

export async function listarBusquedas(idUsuario: number): Promise<BusquedaRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<BusquedaRow>(
      `SELECT ID_busqueda AS id,
              nombre_busqueda AS nombre,
              ID_comuna_busqueda AS idComuna,
              ID_region_busqueda AS idRegion,
              ID_tipo_vehiculo_busqueda AS idTipoVehiculo,
              precio_maximo_busqueda AS precioMaximo,
              CONVERT(char(10), fecha_desde_busqueda, 23) AS fechaDesde,
              CONVERT(char(10), fecha_hasta_busqueda, 23) AS fechaHasta,
              fecha_creacion_busqueda AS fechaCreacion
       FROM dbo.BusquedaGuardada
       WHERE ID_usuario_busqueda = @id AND activa_busqueda = 1
       ORDER BY fecha_creacion_busqueda DESC`,
    );
  return result.recordset;
}

export async function crearBusqueda(
  idUsuario: number,
  input: GuardarBusquedaInput,
): Promise<BusquedaRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .input('nombre', sql.NVarChar(100), input.nombre ?? null)
    .input('ID_comuna', sql.Int, input.ID_comuna ?? null)
    .input('ID_region', sql.Int, input.ID_region ?? null)
    .input('ID_tipo_vehiculo', sql.Int, input.ID_tipo_vehiculo ?? null)
    .input('precio_maximo', sql.Decimal(12, 2), input.precio_maximo ?? null)
    .input('fecha_desde', sql.Date, input.fecha_desde ?? null)
    .input('fecha_hasta', sql.Date, input.fecha_hasta ?? null)
    .execute('u_sp_GuardarBusqueda');
  const row = result.recordset[0] as { ID_busqueda: number } | undefined;
  if (!row) return null;
  const lista = await listarBusquedas(idUsuario);
  return lista.find((busqueda) => busqueda.id === row.ID_busqueda) ?? null;
}

export async function eliminarBusqueda(idBusqueda: number, idUsuario: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_busqueda', sql.Int, idBusqueda)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_EliminarBusqueda');
}
