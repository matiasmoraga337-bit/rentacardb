import { env } from '../config/env';
import * as repo from '../repositories/arriendo.repository';
import {
  type ConductorAdicionalInput,
  type DanoInspeccionInput,
  type DevolucionArriendoInput,
  type IniciarArriendoInput,
  type ListarArriendosQuery,
} from '../schemas/arriendo.schema';
import { AppError } from '../utils/AppError';
import { generarContratoTexto, hashContrato } from '../utils/contract';
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

async function assertAccesoArriendo(
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
  }
> {
  await assertAccesoArriendo(idArriendo, idUsuario, roles);
  const row = await repo.obtenerArriendo(idArriendo);
  if (!row) {
    throw new AppError(404, 'ARRIENDO_NO_ENCONTRADO', 'Arriendo no encontrado.');
  }
  const [inspecciones, danos, cargos, conductores, contrato, resenas] = await Promise.all([
    repo.listarInspecciones(idArriendo),
    repo.listarDanos(idArriendo),
    repo.listarCargos(idArriendo),
    repo.listarConductores(idArriendo),
    repo.obtenerContrato(idArriendo),
    repo.listarResenas(idArriendo),
  ]);
  return { ...row, inspecciones, danos, cargos, conductores, contrato, resenas };
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

  return repo.registrarDano({
    ID_inspeccion: idInspeccion,
    zona: input.zona,
    tipo: input.tipo,
    severidad: input.severidad,
    descripcion: input.descripcion ?? null,
    monto_estimado: input.monto_estimado ?? null,
  });
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

  return repo.registrarConductor({
    ID_arriendo: idArriendo,
    ID_persona: persona.id,
    ID_licencia_conducir: input.ID_licencia_conducir ?? null,
  });
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
  return { contrato, texto, hash, url };
}
