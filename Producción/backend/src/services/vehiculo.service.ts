import * as repo from '../repositories/vehiculo.repository';
import {
  type ActualizarVehiculoInput,
  type DocumentoCreateInput,
  type MantenimientoCreateInput,
  type MantenimientoFinalizarInput,
  type RegistrarVehiculoInput,
  type TarifaCreateInput,
  type TarifaUpdateInput,
} from '../schemas/vehiculo.schema';
import { AppError } from '../utils/AppError';
import { esFechaValida, hoyIsoLocal } from '../utils/dates';
import { isPdf } from '../utils/images';
import { guardarDocumento, guardarFotoVehiculo } from '../utils/uploads';

async function resolverProveedor(idUsuario: number): Promise<number> {
  const idProveedor = await repo.findProveedorIdByUsuario(idUsuario);
  if (!idProveedor) {
    throw new AppError(403, 'SIN_PROVEEDOR', 'El usuario no tiene un proveedor asociado.');
  }
  return idProveedor;
}

async function assertVehiculo(idUsuario: number, idVehiculo: number): Promise<number> {
  const idProveedor = await resolverProveedor(idUsuario);
  if (!(await repo.perteneceAProveedor(idVehiculo, idProveedor))) {
    throw new AppError(403, 'FORBIDDEN', 'El vehiculo no pertenece al proveedor.');
  }
  return idProveedor;
}

export async function registrar(
  idUsuario: number,
  input: RegistrarVehiculoInput,
): Promise<unknown> {
  const idProveedor = await resolverProveedor(idUsuario);
  return repo.registrarVehiculo({
    ID_proveedor: idProveedor,
    ID_modelo: input.ID_modelo,
    ID_tipo_vehiculo: input.ID_tipo_vehiculo,
    ID_tipo_combustible: input.ID_tipo_combustible,
    ID_tipo_transmision: input.ID_tipo_transmision,
    patente: input.patente,
    vin: input.vin,
    anio: input.anio,
    kilometraje: input.kilometraje,
    precio_diario_base: input.precioDiarioBase,
    ID_sede_actual: input.ID_sede_actual,
  });
}

export async function actualizar(
  idUsuario: number,
  idVehiculo: number,
  input: ActualizarVehiculoInput,
): Promise<unknown> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  return repo.actualizarVehiculo(idVehiculo, idProveedor, {
    ID_modelo: input.ID_modelo,
    ID_tipo_vehiculo: input.ID_tipo_vehiculo,
    ID_tipo_combustible: input.ID_tipo_combustible,
    ID_tipo_transmision: input.ID_tipo_transmision,
    ID_estado_vehiculo: input.ID_estado_vehiculo,
    ID_sede_actual: input.ID_sede_actual,
    anio: input.anio,
    kilometraje: input.kilometraje,
    precio_diario_base: input.precioDiarioBase,
  });
}

export async function publicar(idUsuario: number, idVehiculo: number): Promise<void> {
  await repo.publicarVehiculo(idVehiculo, idUsuario);
}

export async function listar(idUsuario: number): Promise<unknown[]> {
  const idProveedor = await resolverProveedor(idUsuario);
  return repo.listarVehiculosProveedor(idProveedor);
}

export async function detalle(idVehiculo: number): Promise<unknown> {
  const vehiculo = await repo.obtenerVehiculo(idVehiculo);
  if (!vehiculo) {
    throw new AppError(404, 'VEHICULO_NO_ENCONTRADO', 'Vehiculo no encontrado.');
  }
  const [fotos, caracteristicas, tarifas, sedes] = await Promise.all([
    repo.listarFotos(idVehiculo),
    repo.listarCaracteristicas(idVehiculo),
    repo.listarTarifas(idVehiculo),
    repo.listarSedesVehiculo(idVehiculo),
  ]);
  const fotosConThumb = (fotos as { id: number; url: string; esPrincipal: boolean }[]).map(
    (foto) => ({ ...foto, thumbUrl: foto.url.replace(/\.webp$/, '-thumb.webp') }),
  );
  return {
    ...(vehiculo as object),
    fotos: fotosConThumb,
    caracteristicas,
    tarifas,
    sedes,
  };
}

export async function subirFotos(
  idUsuario: number,
  idVehiculo: number,
  files: Express.Multer.File[],
): Promise<unknown[]> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  if (files.length === 0) {
    throw new AppError(400, 'SIN_ARCHIVOS', 'No se recibieron imagenes.');
  }

  const existentes = await repo.contarFotosActivas(idVehiculo);
  const creadas: unknown[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const { url } = await guardarFotoVehiculo(idVehiculo, files[i].buffer);
    const esPrincipal = existentes === 0 && i === 0;
    creadas.push(await repo.registrarFoto(idVehiculo, idProveedor, url, esPrincipal));
  }
  return creadas;
}

export async function eliminarFoto(
  idUsuario: number,
  idVehiculo: number,
  idFoto: number,
): Promise<void> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  await repo.eliminarFoto(idFoto, idProveedor);
}

export async function agregarCaracteristica(
  idUsuario: number,
  idVehiculo: number,
  idCaracteristica: number,
  disponible: boolean,
): Promise<unknown> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  return repo.agregarCaracteristica(idVehiculo, idProveedor, idCaracteristica, disponible);
}

export async function quitarCaracteristica(
  idUsuario: number,
  idVehiculo: number,
  idCaracteristica: number,
): Promise<void> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  await repo.quitarCaracteristica(idVehiculo, idProveedor, idCaracteristica);
}

export async function crearTarifa(
  idUsuario: number,
  idVehiculo: number,
  input: TarifaCreateInput,
): Promise<unknown> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  return repo.registrarTarifa(idVehiculo, idProveedor, {
    nombre: input.nombre,
    fecha_inicio: input.fechaInicio,
    fecha_fin: input.fechaFin,
    precio_dia: input.precioDia,
    prioridad: input.prioridad,
    dia_semana: input.diaSemana,
    anticipacion_min: input.anticipacionMin,
    anticipacion_max: input.anticipacionMax,
    dias_minimos: input.diasMinimos,
    dias_maximos: input.diasMaximos,
  });
}

export async function actualizarTarifa(
  idUsuario: number,
  idVehiculo: number,
  idTarifa: number,
  input: TarifaUpdateInput,
): Promise<unknown> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  return repo.actualizarTarifa(idTarifa, idProveedor, {
    nombre: input.nombre,
    fecha_inicio: input.fechaInicio,
    fecha_fin: input.fechaFin,
    precio_dia: input.precioDia,
    prioridad: input.prioridad,
    dia_semana: input.diaSemana,
    anticipacion_min: input.anticipacionMin,
    anticipacion_max: input.anticipacionMax,
    dias_minimos: input.diasMinimos,
    dias_maximos: input.diasMaximos,
  });
}

export async function eliminarTarifa(
  idUsuario: number,
  idVehiculo: number,
  idTarifa: number,
): Promise<void> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  await repo.eliminarTarifa(idTarifa, idProveedor);
}

export async function subirDocumento(
  idUsuario: number,
  idVehiculo: number,
  file: Express.Multer.File | undefined,
  meta: DocumentoCreateInput,
): Promise<unknown> {
  await assertVehiculo(idUsuario, idVehiculo);
  if (!file) {
    throw new AppError(400, 'SIN_ARCHIVO', 'Falta el archivo del documento.');
  }
  if (!isPdf(file.buffer)) {
    throw new AppError(400, 'PDF_INVALIDO', 'El archivo no es un PDF valido.');
  }

  const url = await guardarDocumento(idVehiculo, file.buffer);
  return repo.registrarDocumento(
    idVehiculo,
    meta.ID_tipo_documento,
    meta.numero ?? null,
    meta.fechaEmision ?? null,
    meta.fechaVencimiento,
    url,
  );
}

export async function listarDocumentos(idUsuario: number, idVehiculo: number): Promise<unknown[]> {
  await assertVehiculo(idUsuario, idVehiculo);
  return repo.listarDocumentos(idVehiculo);
}

export async function listarMantenimientos(
  idUsuario: number,
  idVehiculo: number,
): Promise<{ activos: repo.MantenimientoRow[]; historial: repo.MantenimientoRow[] }> {
  await assertVehiculo(idUsuario, idVehiculo);
  return repo.listarMantenimientos(idVehiculo);
}

export async function registrarMantenimiento(
  idUsuario: number,
  idVehiculo: number,
  input: MantenimientoCreateInput,
): Promise<unknown> {
  await assertVehiculo(idUsuario, idVehiculo);
  const vehiculo = (await repo.obtenerVehiculo(idVehiculo)) as
    | { estadoVehiculo?: string }
    | null;
  if (vehiculo?.estadoVehiculo === 'ARRENDADO') {
    throw new AppError(
      409,
      'VEHICULO_ARRENDADO',
      'No se puede iniciar mantenimiento de un vehiculo arrendado.',
    );
  }
  return repo.registrarMantenimiento({
    ID_vehiculo: idVehiculo,
    ID_tipo_mantenimiento: input.ID_tipo_mantenimiento,
    kilometraje: input.kilometraje,
    descripcion: input.descripcion ?? null,
    taller: input.taller ?? null,
    costo: input.costo ?? null,
    ID_usuario_operador: idUsuario,
  });
}

export async function finalizarMantenimiento(
  idUsuario: number,
  idVehiculo: number,
  idMantenimiento: number,
  input: MantenimientoFinalizarInput,
): Promise<unknown> {
  const idProveedor = await assertVehiculo(idUsuario, idVehiculo);
  if (!(await repo.mantenimientoPerteneceAProveedor(idMantenimiento, idProveedor))) {
    throw new AppError(403, 'FORBIDDEN', 'El mantenimiento no pertenece al vehiculo.');
  }
  return repo.finalizarMantenimiento(
    idMantenimiento,
    input.costo_final ?? null,
    idUsuario,
  );
}

export async function buscar(params: repo.BusquedaParams): Promise<unknown[]> {
  return repo.buscarVehiculos(params);
}

export interface DisponibilidadResponse {
  id: number;
  patente: string;
  disponible: boolean;
  motivo: string | null;
  precioDia: number;
  dias: number;
  ivaPorcentaje: number;
  requiereDeposito: boolean;
  deposito: number;
  subtotal: number;
  impuesto: number;
  total: number;
  minutosExpiracion: number;
}

export async function disponibilidad(
  idVehiculo: number,
  desde: string,
  hasta: string,
): Promise<DisponibilidadResponse> {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    throw new AppError(400, 'FECHA_INVALIDA', 'Las fechas no existen en el calendario.');
  }
  if (hasta <= desde) {
    throw new AppError(400, 'FECHAS_INVALIDAS', 'La fecha de fin debe ser posterior al inicio.');
  }
  if (desde < hoyIsoLocal()) {
    throw new AppError(400, 'FECHAS_INVALIDAS', 'La fecha de inicio no puede ser anterior a hoy.');
  }

  const row = await repo.consultarDisponibilidad(idVehiculo, { desde, hasta });
  if (!row) {
    throw new AppError(404, 'VEHICULO_NO_ENCONTRADO', 'Vehiculo no encontrado.');
  }

  let motivo: string | null = null;
  if (!row.publicado) motivo = 'VEHICULO_NO_PUBLICADO';
  else if (row.reservado) motivo = 'RESERVADO_EN_ESAS_FECHAS';
  else if (row.bloqueado) motivo = 'BLOQUEO_ACTIVO';
  else if (row.mantenimiento) motivo = 'MANTENIMIENTO';
  else if (!row.documentosOk) motivo = 'DOCUMENTOS_VEHICULO_INVALIDOS';
  else if (!row.sedesOk) motivo = 'SEDES_NO_HABILITADAS';
  else if (!row.duracionOk) motivo = 'DURACION_FUERA_DE_RANGO';

  return {
    id: row.id,
    patente: row.patente,
    disponible: Boolean(row.disponible),
    motivo,
    precioDia: row.precioDia,
    dias: row.dias,
    ivaPorcentaje: row.ivaPorcentaje,
    requiereDeposito: Boolean(row.requiereDeposito),
    deposito: row.deposito,
    subtotal: row.subtotal,
    impuesto: row.impuesto,
    total: row.total,
    minutosExpiracion: row.minutosExpiracion ?? 30,
  };
}
