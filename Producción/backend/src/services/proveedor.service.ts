import bcrypt from 'bcryptjs';
import { buildAppLink, sendMail } from '../config/mailer';
import * as repo from '../repositories/proveedor.repository';
import {
  type CambiarEstadoProveedorInput,
  type ConfiguracionInput,
  type RegistrarProveedorInput,
  type RegistroProveedorPublicoInput,
  type SedeCreateInput,
  type SedeUpdateInput,
} from '../schemas/proveedor.schema';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';

async function assertAcceso(idProveedor: number, idUsuario: number): Promise<void> {
  if (await repo.esAdmin(idUsuario)) return;
  if (await repo.esProveedorDeUsuario(idProveedor, idUsuario)) return;
  throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a este proveedor.');
}

export async function registrar(
  idUsuario: number,
  input: RegistrarProveedorInput,
): Promise<unknown> {
  const idTipo = await repo.findTipoProveedorId(input.tipo);
  if (!idTipo) {
    throw new AppError(400, 'TIPO_PROVEEDOR_INVALIDO', 'Tipo de proveedor invalido.');
  }

  let idPersona: number | null = null;
  if (input.tipo === 'PERSONA') {
    idPersona = await repo.findPersonaIdByUsuario(idUsuario);
    if (!idPersona) {
      throw new AppError(400, 'PERSONA_NO_ENCONTRADA', 'El usuario no tiene persona asociada.');
    }
  }

  const creado = await repo.registrarProveedor({
    ID_tipo_proveedor: idTipo,
    ID_persona_proveedor: idPersona,
    nombre_comercial: input.nombreComercial,
    razon_social: input.razonSocial,
    rut_proveedor: input.rutProveedor,
    telefono: input.telefono,
    email: input.email,
  });

  await repo.asignarRol(idUsuario, 'PROVEEDOR', idUsuario);
  await repo.vincularUsuario(creado.ID_proveedor, idUsuario, true);

  return repo.obtenerProveedor(creado.ID_proveedor);
}

function mapSqlError(error: unknown): never {
  const sqlError = error as { number?: number; message?: string };
  const number = sqlError.number;
  if (number === 51105 || number === 51106 || number === 51107) {
    throw new AppError(409, 'PROVEEDOR_DUPLICADO', sqlError.message ?? 'El proveedor ya existe.');
  }
  if (number === 53031) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', sqlError.message ?? 'Proveedor no encontrado.');
  }
  if (number === 53032) {
    throw new AppError(409, 'TRANSICION_INVALIDA', sqlError.message ?? 'Transicion no permitida.');
  }
  if (number === 53033) {
    throw new AppError(400, 'MOTIVO_REQUERIDO', sqlError.message ?? 'El motivo es obligatorio.');
  }
  if (number && number >= 51000 && number < 52000) {
    throw new AppError(400, 'DATOS_PROVEEDOR_INVALIDOS', sqlError.message ?? 'Datos de proveedor invalidos.');
  }
  throw error;
}

export interface RegistroPublicoResult {
  token: string;
  usuario: {
    id: number;
    email: string;
    emailConfirmado: boolean;
    nombres: string;
    apellidoPaterno: string | null;
    roles: string[];
  };
  proveedor: { id: number; estado: string };
  tokenVerificacion?: string;
}

export async function registrarPublico(
  input: RegistroProveedorPublicoInput,
): Promise<RegistroPublicoResult> {
  const passwordHash = await bcrypt.hash(input.cuenta.password, 10);
  let row: repo.ProveedorPublicoRow;
  try {
    row = await repo.registrarProveedorPublico({
      rut: input.cuenta.rut,
      nombres: input.cuenta.nombres,
      apellido_paterno: input.cuenta.apellidoPaterno,
      apellido_materno: input.cuenta.apellidoMaterno,
      telefono: input.cuenta.telefono,
      email: input.cuenta.email,
      password_hash: passwordHash,
      tipo_proveedor: input.proveedor.tipo,
      nombre_comercial: input.proveedor.nombreComercial,
      razon_social: input.proveedor.razonSocial,
      rut_proveedor: input.proveedor.rutProveedor,
      telefono_proveedor: input.proveedor.telefono,
      email_proveedor: input.proveedor.email,
    });
  } catch (error) {
    mapSqlError(error);
  }

  const roles = row.roles.split(',').map((role) => role.trim()).filter(Boolean);
  const token = signToken({ sub: row.ID_usuario, email: row.email_usuario, roles });
  if (row.token_verificacion) {
    const link = buildAppLink('/verificar-email', row.token_verificacion);
    await sendMail({
      to: row.email_usuario,
      subject: 'Verifica tu email - RentaCarDB',
      html: `<p>Hola ${row.nombres_persona},</p><p>Tu cuenta de proveedor fue creada. Confirma tu email:</p><p><a href="${link}">Verificar email</a></p><p>El enlace expira en 24 horas.</p>`,
      text: `Verifica tu email: ${link}`,
    }).catch((err: unknown) =>
      console.warn('No se pudo enviar el correo de verificacion:', (err as Error).message),
    );
  }

  return {
    token,
    usuario: {
      id: row.ID_usuario,
      email: row.email_usuario,
      emailConfirmado: false,
      nombres: row.nombres_persona,
      apellidoPaterno: null,
      roles,
    },
    proveedor: { id: row.ID_proveedor, estado: row.estado_proveedor },
    tokenVerificacion: row.token_verificacion,
  };
}

export async function cambiarEstado(
  idProveedor: number,
  idAdmin: number,
  input: CambiarEstadoProveedorInput,
): Promise<unknown> {
  try {
    return await repo.cambiarEstadoProveedor(idProveedor, idAdmin, input.estado, input.motivo);
  } catch (error) {
    mapSqlError(error);
  }
}

export async function mio(idUsuario: number): Promise<unknown> {
  const proveedor = await repo.findProveedorByUsuario(idUsuario);
  if (!proveedor) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', 'El usuario no tiene proveedor.');
  }
  return proveedor;
}

export async function obtener(idProveedor: number): Promise<unknown> {
  const proveedor = await repo.obtenerProveedor(idProveedor);
  if (!proveedor) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', 'Proveedor no encontrado.');
  }
  return proveedor;
}

export async function listar(estado?: string): Promise<unknown[]> {
  return repo.listarProveedores(estado);
}

export async function aprobar(idProveedor: number, idAdmin: number): Promise<unknown> {
  await repo.aprobarProveedor(idProveedor, idAdmin);
  return obtener(idProveedor);
}

export async function actualizarConfiguracion(
  idProveedor: number,
  idUsuario: number,
  data: ConfiguracionInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.actualizarConfiguracion(idProveedor, data);
}

export async function listarSedes(idProveedor: number, idUsuario: number): Promise<unknown[]> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.listarSedes(idProveedor);
}

export async function crearSede(
  idProveedor: number,
  idUsuario: number,
  data: SedeCreateInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.registrarSede(idProveedor, data);
}

export async function actualizarSede(
  idProveedor: number,
  idSede: number,
  idUsuario: number,
  data: SedeUpdateInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.actualizarSede(idProveedor, idSede, data);
}

export async function eliminarSede(
  idProveedor: number,
  idSede: number,
  idUsuario: number,
): Promise<void> {
  await assertAcceso(idProveedor, idUsuario);
  await repo.eliminarSede(idProveedor, idSede);
}
