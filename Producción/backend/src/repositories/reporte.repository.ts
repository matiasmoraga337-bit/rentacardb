import { getPool } from '../config/db';

export interface ReporteLiquidacionRow {
  ID_liquidacion: number;
  nombre_comercial_proveedor: string;
  periodo_desde_liquidacion: string;
  periodo_hasta_liquidacion: string;
  nombre_estado_liquidacion: string;
  monto_bruto_liquidacion: number;
  monto_comision_liquidacion: number;
  monto_neto_liquidacion: number;
  fecha_calculo_liquidacion: string;
  fecha_pago_liquidacion: string | null;
}

export interface ReporteProveedorRow {
  ID_proveedor: number;
  nombre_proveedor: string;
  cantidad_vehiculos: number;
  cantidad_publicados: number;
  cantidad_reservas: number;
  total_pagado: number;
}

export interface ReporteTipoProveedorRow {
  nombre_tipo_proveedor: string;
  cantidad_proveedores: number;
}

export interface IntegridadErrorRow {
  codigo: string;
  cantidad: number;
  descripcion_movimiento_financiero: string;
}

export async function reporteLiquidaciones(): Promise<ReporteLiquidacionRow[]> {
  const pool = await getPool();
  const result = await pool.request().execute<ReporteLiquidacionRow>('u_sp_ReporteLiquidaciones');
  return result.recordset;
}

export async function reporteProveedores(): Promise<ReporteProveedorRow[]> {
  const pool = await getPool();
  const result = await pool.request().execute<ReporteProveedorRow>('u_sp_ReporteProveedores');
  return result.recordset;
}

export async function reporteTiposProveedor(): Promise<ReporteTipoProveedorRow[]> {
  const pool = await getPool();
  const result = await pool.request().execute<ReporteTipoProveedorRow>(
    'u_sp_ReporteTiposProveedor',
  );
  return result.recordset;
}

export async function validarIntegridad(): Promise<{
  ok: boolean;
  errores: IntegridadErrorRow[];
}> {
  const pool = await getPool();
  const result = await pool.request().execute<IntegridadErrorRow>('u_sp_ValidarIntegridad');
  return {
    ok: result.returnValue === 0,
    errores: result.recordset,
  };
}
