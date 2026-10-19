import { type Request, type Response } from 'express';
import * as authService from '../services/auth.service';
import { type LoginInput, type RegistroInput } from '../schemas/auth.schema';

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
  res.status(201).json({
    message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.',
    usuario: {
      id: result.ID_usuario,
      rut: result.rut_persona,
      nombres: result.nombres_persona,
      email: result.email_usuario,
      rol: result.nombre_rol,
    },
    tokenVerificacion: result.token_verificacion,
  });
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
