import { env } from '../config/env';
import * as repo from '../repositories/arriendo.repository';
import {
  type CargoExtraInput,
  type ConductorAdicionalInput,
  type DanoInspeccionInput,
  type DevolucionArriendoInput,
  type IniciarArriendoInput,
  type ListarArriendosQuery,
  type MultaInput,
} from '../schemas/arriendo.schema';
import { AppError } from '../utils/AppError';
import { generarContratoTexto, hashContrato } from '../utils/contract';
import { esFechaValida } from '../utils/dates';
import { guardarFotoInspeccion } from '../utils/uploads';
import { assertAccesoReserva } from './reserva.service';

const esAdmin = (roles: string[]): boolean => roles.includes('ADMIN');
const esCliente = (roles: string[]): boolean => roles.includes('CLIENTE');
const esProveedorRol = (roles: string[]): boolean =>
  roles.includes('PROVEEDOR') || roles.includes('OPERADOR');

async function elegirScope(
  idUsuario: number,
  roles: string[],
  solicitado?: repo.ScopeArriendos,
): Promise<repo.ScopeArriendos> {
  if (esAdmin(roles)) {
    if (solicitado === 'cliente' || solicitado === 'proveedor') return solicitado;
    return 'todos';
  }
  if (solicitado === 'todos') {
    throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para ver todos los arriendos.');
  }
  if (solicitado === 'cliente') {
    if (esCliente(roles)) return 'cliente';
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene rol CLIENTE.');
  }
  if (solicitado === 'proveedor') {
    if (esProveedorRol(roles) && (await repo.esProveedorDeUsuario(idUsuario))) return 'proveedor';
    throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene un proveedor asociado.');
  }
  if (esCliente(roles)) return 'cliente';
  if (esProveedorRol(roles) && (await repo.esProveedorDeUsuario(idUsuario))) return 'proveedor';
  throw new AppError(403, 'FORBIDDEN', 'El usuario no tiene acceso a arriendos.');
}

export async function assertAccesoArriendo(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
): Promise<repo.ArriendoAcceso> {
  const acceso = await repo.obtenerAccesoArriendo(idArriendo);
  if (!acceso) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  if (esAdmin(roles)) return acceso;
  if (esCliente(roles) && acceso.idCliente === idUsuario) return acceso;
  if (esProveedorRol(roles) && (await repo.esProveedorDelVehiculo(acceso.idProveedor, idUsuario))) {
    return acceso;
  }
  throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a este arriendo.');
}

async function assertOperador(
  acceso: { idProveedor: number },
  idUsuario: number,
  roles: string[],
): Promise<void> {
  if (esAdmin(roles)) return;
  if (esProveedorRol(roles) && (await repo.esProveedorDelVehiculo(acceso.idProveedor, idUsuario))) {
    return;
  }
  throw new AppError(403, 'FORBIDDEN', 'Solo el proveedor u operador puede realizar esta accion.');
}

const CARGO_ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  53020: { status: 400, code: 'MONTO_INVALIDO', message: 'El monto debe ser mayor que cero.' },
  53021: { status: 404, code: 'ARRIENDO_NO_ENCONTRADO', message: 'Arriendo no encontrado.' },
  53022: {
    status: 409,
    code: 'ARRIENDO_NO_FINALIZADO',
    message: 'Solo se registran cargos en un arriendo finalizado.',
  },
};

const MULTA_ERROR_MAP: Record<number, { status: number; code: string; message: string }> = {
  60040: { status: 400, code: 'MONTO_INVALIDO', message: 'El monto debe ser mayor que cero.' },
  60041: {
    status: 409,
    code: 'ARRIENDO_NO_FINALIZADO',
    message: 'Solo se registran multas en un arriendo finalizado.',
  },
  60042: { status: 404, code: 'USUARIO_NO_ENCONTRADO', message: 'Usuario no encontrado.' },
};

function traducirError(
  error: unknown,
  mapa: Record<number, { status: number; code: string; message: string }>,
): never {
  const sqlError = error as { number?: number };
  const mapped = sqlError.number ? mapa[sqlError.number] : undefined;
  if (mapped) throw new AppError(mapped.status, mapped.code, mapped.message);
  throw error;
}

export async function listarArriendos(
  idUsuario: number,
  roles: string[],
  query: ListarArriendosQuery,
): Promise<{ data: repo.ArriendoListRow[]; page: number; pageSize: number; total: number }> {
  const scope = await elegirScope(idUsuario, roles, query.scope);
  const { rows, total } = await repo.listarArriendos({
    scope,
    idUsuario,
    estado: query.estado,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { data: rows, page: query.page, pageSize: query.pageSize, total };
}

export async function obtenerArriendo(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
): Promise<
  repo.ArriendoListRow & {
    inspecciones: repo.InspeccionRow[];
    danos: repo.DanoRow[];
    cargos: repo.CargoRow[];
    conductores: repo.ConductorRow[];
    contrato: repo.ContratoRow | null;
    resenas: repo.ResenaRow[];
    multas: repo.MultaRow[];
  }
> {
  await assertAccesoArriendo(idArriendo, idUsuario, roles);
  const row = await repo.obtenerArriendo(idArriendo);
  if (!row) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  const [inspecciones, fotos, danos, cargos, conductores, contrato, resenas, multas] =
    await Promise.all([
      repo.listarInspecciones(idArriendo),
      repo.listarFotosInspecciones(idArriendo),
      repo.listarDanos(idArriendo),
      repo.listarCargos(idArriendo),
      repo.listarConductores(idArriendo),
      repo.obtenerContrato(idArriendo),
      repo.listarResenas(idArriendo),
      repo.listarMultas(idArriendo),
    ]);
  const inspeccionesConFotos = inspecciones.map((inspeccion) => ({
    ...inspeccion,
    fotos: fotos.filter((foto) => foto.inspeccionId === inspeccion.id),
  }));
  return {
    ...row,
    inspecciones: inspeccionesConFotos,
    danos,
    cargos,
    conductores,
    contrato,
    resenas,
    multas,
  };
}

export async function iniciarArriendo(
  idUsuario: number,
  roles: string[],
  input: IniciarArriendoInput,
): Promise<repo.ArriendoListRow> {
  const accesoReserva = await assertAccesoReserva(input.ID_reserva, idUsuario, roles);
  if (!esAdmin(roles)) {
    await assertOperador(accesoReserva, idUsuario, roles);
  }
  const kmActual = await repo.obtenerKilometrajeVehiculoPorReserva(input.ID_reserva);
  if (kmActual === null) {
    throw new AppError(404, 'RESERVA_NO_ENCONTRADA', 'Reserva no encontrada.');
  }
  if (input.kilometraje_inicial < kmActual) {
    throw new AppError(
      400,
      'KILOMETRAJE_INVALIDO',
      `El kilometraje inicial no puede ser menor al odometro actual (${kmActual}).`,
    );
  }

  const idArriendo = await repo.iniciarArriendo({
    ...input,
    ID_usuario_operador: idUsuario,
  });
  if (!idArriendo) {
    throw new AppError(500, 'ARRIENDO_NO_INICIADO', 'No se pudo iniciar el arriendo.');
  }
  const row = await repo.obtenerArriendo(idArriendo);
  if (!row) {
    throw new AppError(500, 'ARRIENDO_NO_ENCONTRADO', 'No se pudo leer el arriendo creado.');
  }
  return row;
}

export async function registrarDevolucion(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
  input: DevolucionArriendoInput,
): Promise<repo.ArriendoListRow> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  await assertOperador(acceso, idUsuario, roles);
  if (acceso.estadoArriendo !== 'ACTIVO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_ACTIVO',
      `El arriendo esta en estado ${acceso.estadoArriendo}.`,
    );
  }

  const id = await repo.registrarDevolucion({
    ID_arriendo: idArriendo,
    ...input,
    ID_usuario_operador: idUsuario,
  });
  if (!id) {
    throw new AppError(500, 'DEVOLUCION_NO_REGISTRADA', 'No se pudo registrar la devolucion.');
  }
  const row = await repo.obtenerArriendo(idArriendo);
  if (!row) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  return row;
}

export async function registrarDano(
  idArriendo: number,
  idInspeccion: number,
  idUsuario: number,
  roles: string[],
  input: DanoInspeccionInput,
): Promise<unknown | null> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  await assertOperador(acceso, idUsuario, roles);

  const inspeccion = await repo.obtenerInspeccion(idInspeccion);
  if (!inspeccion || inspeccion.idArriendo !== idArriendo) {
    throw new AppError(404, 'INSPECCION_NO_ENCONTRADA', 'Inspeccion no encontrada.');
  }
  if (inspeccion.tipo !== 'DEVOLUCION') {
    throw new AppError(
      409,
      'DANO_SOLO_DEVOLUCION',
      'Solo se registran danos en la inspeccion de devolucion.',
    );
  }

  const dano = await repo.registrarDano({
    ID_inspeccion: idInspeccion,
    zona: input.zona,
    tipo: input.tipo,
    severidad: input.severidad,
    descripcion: input.descripcion ?? null,
    monto_estimado: input.monto_estimado ?? null,
  });
  if (!dano) {
    throw new AppError(500, 'DANO_NO_REGISTRADO', 'No se pudo registrar el dano.');
  }
  return dano;
}

export async function registrarFotoInspeccion(
  idArriendo: number,
  idInspeccion: number,
  idUsuario: number,
  roles: string[],
  files: Express.Multer.File[],
): Promise<unknown[]> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  await assertOperador(acceso, idUsuario, roles);

  const inspeccion = await repo.obtenerInspeccion(idInspeccion);
  if (!inspeccion || inspeccion.idArriendo !== idArriendo) {
    throw new AppError(404, 'INSPECCION_NO_ENCONTRADA', 'Inspeccion no encontrada.');
  }
  if (files.length === 0) {
    throw new AppError(400, 'SIN_ARCHIVOS', 'No se recibieron imagenes.');
  }

  const creadas: unknown[] = [];
  for (const file of files) {
    const { url } = await guardarFotoInspeccion(idArriendo, idInspeccion, file.buffer);
    creadas.push(
      await repo.registrarFotoInspeccion({
        ID_inspeccion: idInspeccion,
        url_foto: url,
      }),
    );
  }
  return creadas;
}

export async function registrarCargoExtra(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
  input: CargoExtraInput,
): Promise<unknown | null> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  await assertOperador(acceso, idUsuario, roles);
  if (acceso.estadoArriendo !== 'FINALIZADO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_FINALIZADO',
      'Solo se registran cargos en un arriendo finalizado.',
    );
  }

  try {
    return await repo.crearCargoExtra({
      ID_arriendo: idArriendo,
      concepto: input.concepto,
      monto: input.monto,
      observaciones: input.observaciones ?? null,
      ID_usuario_operador: idUsuario,
      nombre_tipo_cargo: input.tipo_cargo,
    });
  } catch (error) {
    traducirError(error, CARGO_ERROR_MAP);
  }
}

export async function registrarMulta(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
  input: MultaInput,
): Promise<unknown | null> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  await assertOperador(acceso, idUsuario, roles);
  if (acceso.estadoArriendo !== 'FINALIZADO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_FINALIZADO',
      'Solo se registran multas en un arriendo finalizado.',
    );
  }
  if (!esFechaValida(input.fecha_multa)) {
    throw new AppError(400, 'FECHA_INVALIDA', 'La fecha de la multa no es valida.');
  }

  try {
    return await repo.registrarMulta({
      ID_arriendo: idArriendo,
      fecha_multa: input.fecha_multa,
      descripcion: input.descripcion,
      monto: input.monto,
      organismo: input.organismo ?? null,
      numero_parte: input.numero_parte ?? null,
      ID_usuario_registro: idUsuario,
    });
  } catch (error) {
    traducirError(error, MULTA_ERROR_MAP);
  }
}

export async function registrarConductor(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
  input: ConductorAdicionalInput,
): Promise<unknown | null> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  if (!esAdmin(roles) && acceso.idCliente !== idUsuario) {
    throw new AppError(403, 'FORBIDDEN', 'Solo el cliente propietario puede agregar conductores.');
  }
  if (acceso.estadoArriendo !== 'ACTIVO') {
    throw new AppError(409, 'ARRIENDO_NO_ACTIVO', 'El arriendo no esta activo.');
  }

  const persona = await repo.obtenerPersonaPorRut(input.rut);
  if (!persona) {
    throw new AppError(404, 'PERSONA_NO_ENCONTRADA', 'No existe una persona con ese RUT.');
  }
  const idLicencia =
    input.ID_licencia_conducir ?? (await repo.obtenerLicenciaActivaPersona(persona.id));

  const conductor = await repo.registrarConductor({
    ID_arriendo: idArriendo,
    ID_persona: persona.id,
    ID_licencia_conducir: idLicencia,
  });
  if (!conductor) {
    throw new AppError(500, 'CONDUCTOR_NO_REGISTRADO', 'No se pudo registrar el conductor.');
  }
  return conductor;
}

export async function obtenerContrato(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
): Promise<{
  texto: string;
  hash: string;
  url: string;
  aceptacion: repo.ContratoRow | null;
}> {
  await assertAccesoArriendo(idArriendo, idUsuario, roles);
  const datos = await repo.obtenerDatosContrato(idArriendo);
  if (!datos) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  const texto = generarContratoTexto(datos);
  const hash = hashContrato(texto);
  const url = `${env.APP_URL}/arriendos/${idArriendo}/contrato`;
  const aceptacion = await repo.obtenerContrato(idArriendo);
  return { texto, hash, url, aceptacion };
}

export async function aceptarContrato(
  idArriendo: number,
  idUsuario: number,
  roles: string[],
  ip?: string,
  userAgent?: string,
): Promise<{
  contrato: repo.ContratoRow | null;
  texto: string;
  hash: string;
  url: string;
}> {
  const acceso = await assertAccesoArriendo(idArriendo, idUsuario, roles);
  if (!esAdmin(roles) && acceso.idCliente !== idUsuario) {
    throw new AppError(403, 'FORBIDDEN', 'Solo el cliente puede aceptar el contrato.');
  }
  if (acceso.estadoArriendo !== 'ACTIVO') {
    throw new AppError(
      409,
      'ARRIENDO_NO_ACTIVO',
      'El contrato solo se puede aceptar mientras el arriendo esta activo.',
    );
  }

  const datos = await repo.obtenerDatosContrato(idArriendo);
  if (!datos) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  const texto = generarContratoTexto(datos);
  const hash = hashContrato(texto);
  const url = `${env.APP_URL}/arriendos/${idArriendo}/contrato`;
  const contrato = await repo.crearAceptacionContrato({
    ID_arriendo: idArriendo,
    hash_contrato: hash,
    url_contrato: url,
    ip_aceptacion: ip ?? null,
    user_agent: userAgent ?? null,
    ID_usuario: idUsuario,
  });
  if (!contrato) {
    throw new AppError(500, 'CONTRATO_NO_REGISTRADO', 'No se pudo registrar la aceptacion.');
  }
  return { contrato, texto, hash, url };
}
