import bcrypt from 'bcryptjs';
import * as repo from '../repositories/auth.repository';
import { type LoginInput, type RegistroInput } from '../schemas/auth.schema';
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
  return row;
}

export async function me(id: number): Promise<repo.UsuarioRow> {
  const row = await repo.findUserById(id);
  if (!row) {
    throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return row;
}
