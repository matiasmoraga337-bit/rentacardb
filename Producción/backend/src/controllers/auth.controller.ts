import { type Request, type Response } from 'express';
import { isNonProduction } from '../config/mailer';
import {
  type LoginInput,
  type PerfilInput,
  type RecuperarInput,
  type RegistroInput,
  type ResetPasswordInput,
  type VerificarEmailInput,
} from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(
    req.body as LoginInput,
    req.ip,
    req.get('user-agent') ?? undefined,
  );
  res.status(200).json(result);
}

export async function registro(req: Request, res: Response): Promise<void> {
  const result = await authService.registrar(req.body as RegistroInput);
  const payload: Record<string, unknown> = {
    message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.',
    usuario: {
      id: result.ID_usuario,
      rut: result.rut_persona,
      nombres: result.nombres_persona,
      email: result.email_usuario,
      rol: result.nombre_rol,
    },
  };
  if (isNonProduction()) {
    payload.tokenVerificacion = result.token_verificacion;
  }
  res.status(201).json(payload);
}

export async function verificarEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body as VerificarEmailInput;
  await authService.verificarEmail(token);
  res.status(200).json({ message: 'Email verificado correctamente.' });
}

export async function recuperar(req: Request, res: Response): Promise<void> {
  const { email } = req.body as RecuperarInput;
  await authService.solicitarReset(email);
  res.status(200).json({
    message: 'Si el email esta registrado, recibiras un enlace para restablecer la contrasena.',
  });
}

export async function recuperarConfirmar(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as ResetPasswordInput;
  await authService.confirmarReset(token, password);
  res.status(200).json({ message: 'Contrasena actualizada correctamente.' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const row = await authService.me(req.user!.id);
  res.status(200).json({
    id: row.ID_usuario,
    rut: row.rut_persona,
    nombres: row.nombres_persona,
    apellidoPaterno: row.apellido_paterno_persona,
    apellidoMaterno: row.apellido_materno_persona,
    telefono: row.telefono_persona,
    email: row.email_usuario,
    emailConfirmado: row.email_confirmado_usuario,
    roles: row.roles ? row.roles.split(',').map((r) => r.trim()) : [],
  });
}

export async function actualizarPerfil(req: Request, res: Response): Promise<void> {
  const data = req.body as PerfilInput;
  const row = await authService.actualizarPerfil(req.user!.id, data);
  res.status(200).json({
    id: row.ID_usuario,
    rut: row.rut_persona,
    nombres: row.nombres_persona,
    apellidoPaterno: row.apellido_paterno_persona,
    apellidoMaterno: row.apellido_materno_persona,
    telefono: row.telefono_persona,
    email: row.email_usuario,
    emailConfirmado: row.email_confirmado_usuario,
  });
}

export async function roles(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', 'El id debe ser un entero positivo.');
  }
  res.status(200).json({ id, roles: await authService.rolesDeUsuario(id) });
}
