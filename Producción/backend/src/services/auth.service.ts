import bcrypt from 'bcryptjs';
import { buildAppLink, sendMail } from '../config/mailer';
import * as repo from '../repositories/auth.repository';
import {
  type LoginInput,
  type LicenciaInput,
  type PerfilInput,
  type RegistroInput,
} from '../schemas/auth.schema';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';

const BCRYPT_ROUNDS = 10;

const splitRoles = (roles: string | null): string[] =>
  roles
    ? roles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

export interface SesionResult {
  token: string;
  usuario: {
    id: number;
    email: string;
    emailConfirmado: boolean;
    nombres: string;
    apellidoPaterno: string | null;
    roles: string[];
  };
}

export async function login(
  input: LoginInput,
  ip?: string,
  userAgent?: string,
): Promise<SesionResult> {
  const storedHash = await repo.findPasswordHashByEmail(input.email);
  if (!storedHash) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Credenciales invalidas.');
  }

  const passwordOk = await bcrypt.compare(input.password, storedHash);
  if (!passwordOk) {
    await repo.login(input.email, '__invalid__', ip, userAgent).catch(() => undefined);
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Credenciales invalidas.');
  }

  const row = await repo.login(input.email, storedHash, ip, userAgent);
  if (!row) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Credenciales invalidas.');
  }

  const roles = splitRoles(row.roles);
  const token = signToken({ sub: row.ID_usuario, email: row.email_usuario, roles });

  return {
    token,
    usuario: {
      id: row.ID_usuario,
      email: row.email_usuario,
      emailConfirmado: row.email_confirmado_usuario,
      nombres: row.nombres_persona,
      apellidoPaterno: row.apellido_paterno_persona,
      roles,
    },
  };
}

export async function registrar(input: RegistroInput): Promise<repo.RegistrarUsuarioRow> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const row = await repo.registrarUsuario({
    rut: input.rut,
    nombres: input.nombres,
    apellidoPaterno: input.apellidoPaterno,
    apellidoMaterno: input.apellidoMaterno,
    telefono: input.telefono,
    email: input.email,
    passwordHash,
    rol: 'CLIENTE',
  });
  if (!row) {
    throw new AppError(500, 'REGISTRO_FALLIDO', 'No se pudo registrar el usuario.');
  }

  if (row.token_verificacion) {
    const link = buildAppLink('/verificar-email', row.token_verificacion);
    await sendMail({
      to: row.email_usuario,
      subject: 'Verifica tu email - RentaCarDB',
      html: `<p>Hola ${row.nombres_persona},</p><p>Gracias por registrarte en RentaCarDB. Confirma tu email:</p><p><a href="${link}">Verificar email</a></p><p>El enlace expira en 24 horas.</p>`,
      text: `Verifica tu email: ${link}`,
    }).catch((err: unknown) =>
      console.warn('No se pudo enviar el correo de verificacion:', (err as Error).message),
    );
  }

  return row;
}

export async function verificarEmail(token: string): Promise<void> {
  await repo.verificarEmail(token);
}

export async function solicitarReset(email: string): Promise<void> {
  let token: string | null = null;
  try {
    token = await repo.solicitarReset(email);
  } catch (err) {
    if ((err as { number?: number }).number === 51140) return;
    throw err;
  }
  if (!token) return;

  const link = buildAppLink('/reset-password', token);
  await sendMail({
    to: email,
    subject: 'Recuperar contrasena - RentaCarDB',
    html: `<p>Recibimos una solicitud para restablecer tu contrasena.</p><p><a href="${link}">Restablecer contrasena</a></p><p>El enlace expira en 1 hora. Si no lo solicitaste, ignora este correo.</p>`,
    text: `Restablece tu contrasena: ${link}`,
  }).catch((err: unknown) =>
    console.warn('No se pudo enviar el correo de reset:', (err as Error).message),
  );
}

export async function confirmarReset(token: string, password: string): Promise<void> {
  const nuevoHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await repo.confirmarReset(token, nuevoHash);
}

export async function actualizarPerfil(id: number, data: PerfilInput): Promise<repo.PerfilRow> {
  const row = await repo.actualizarPerfil(id, data);
  if (!row) {
    throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return row;
}

export async function obtenerLicencia(id: number): Promise<repo.LicenciaRow | null> {
  const row = await repo.findUserById(id);
  if (!row) {
    throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return repo.obtenerLicencia(row.ID_persona_usuario);
}

export async function registrarLicencia(
  id: number,
  input: LicenciaInput,
): Promise<repo.LicenciaRow | null> {
  const row = await repo.findUserById(id);
  if (!row) {
    throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return repo.registrarLicencia(row.ID_persona_usuario, input);
}

export async function rolesDeUsuario(id: number): Promise<string[]> {
  return repo.listarRolesUsuario(id);
}

export async function me(id: number): Promise<repo.UsuarioRow> {
  const row = await repo.findUserById(id);
  if (!row) {
    throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return row;
}
