import sql from 'mssql';
import { getPool } from '../config/db';

export interface LoginRow {
  ID_usuario: number;
  email_usuario: string;
  email_confirmado_usuario: boolean;
  nombres_persona: string;
  apellido_paterno_persona: string | null;
  roles: string | null;
}

export interface RegistrarUsuarioInput {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono?: string;
  email: string;
  passwordHash: string;
  rol?: string;
}

export interface RegistrarUsuarioRow {
  ID_usuario: number;
  rut_persona: string;
  nombres_persona: string;
  email_usuario: string;
  nombre_rol: string;
  token_verificacion: string;
}

export interface UsuarioRow {
  ID_usuario: number;
  rut_persona: string;
  nombres_persona: string;
  apellido_paterno_persona: string | null;
  apellido_materno_persona: string | null;
  telefono_persona: string | null;
  email_usuario: string;
  email_confirmado_usuario: boolean;
  roles: string | null;
}

export async function findPasswordHashByEmail(email: string): Promise<string | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.VarChar(150), email)
    .query<{ password_hash_usuario: string }>(
      'SELECT password_hash_usuario FROM Usuario WHERE email_usuario = @email',
    );
  return result.recordset[0]?.password_hash_usuario ?? null;
}

export async function login(
  email: string,
  passwordHash: string,
  ip?: string,
  userAgent?: string,
): Promise<LoginRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.VarChar(150), email)
    .input('password_hash', sql.VarChar(255), passwordHash)
    .input('ip', sql.VarChar(45), ip ?? null)
    .input('user_agent', sql.NVarChar(300), userAgent ?? null)
    .execute<LoginRow>('sp_Login');
  return result.recordset[0] ?? null;
}

export async function registrarUsuario(
  input: RegistrarUsuarioInput,
): Promise<RegistrarUsuarioRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('rut', sql.VarChar(12), input.rut)
    .input('nombres', sql.NVarChar(80), input.nombres)
    .input('apellido_paterno', sql.NVarChar(50), input.apellidoPaterno)
    .input('apellido_materno', sql.NVarChar(50), input.apellidoMaterno ?? null)
    .input('telefono', sql.VarChar(20), input.telefono ?? null)
    .input('fecha_nacimiento', sql.Date, null)
    .input('email', sql.VarChar(150), input.email)
    .input('password_hash', sql.VarChar(255), input.passwordHash)
    .input('rol', sql.VarChar(50), input.rol ?? 'CLIENTE')
    .execute<RegistrarUsuarioRow>('sp_RegistrarUsuario');
  return result.recordset[0] ?? null;
}

export async function findUserById(id: number): Promise<UsuarioRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query<UsuarioRow>(
      `
      SELECT u.ID_usuario,
             p.rut_persona,
             p.nombres_persona,
             p.apellido_paterno_persona,
             p.apellido_materno_persona,
             p.telefono_persona,
             u.email_usuario,
             u.email_confirmado_usuario,
             (SELECT STRING_AGG(r.nombre_rol, ',')
              FROM UsuarioRol ur
              INNER JOIN Rol r ON r.ID_rol = ur.ID_rol_usuario_rol
              WHERE ur.ID_usuario_usuario_rol = u.ID_usuario) AS roles
      FROM Usuario u
      INNER JOIN Persona p ON p.ID_persona = u.ID_persona_usuario
      WHERE u.ID_usuario = @id
      `,
    );
  return result.recordset[0] ?? null;
}
