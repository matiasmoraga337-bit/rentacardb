import { z } from 'zod';
import { esFechaValida } from '../utils/dates';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido (YYYY-MM-DD).')
  .refine(esFechaValida, 'La fecha no existe en el calendario.');

export const loginSchema = z.object({
  email: z.string().email('Email invalido.'),
  password: z.string().min(1, 'La contrasena es obligatoria.'),
});

export const registroSchema = z.object({
  rut: z.string().min(3, 'RUT invalido.'),
  nombres: z.string().min(1, 'Nombres obligatorios.'),
  apellidoPaterno: z.string().min(1, 'Apellido paterno obligatorio.'),
  apellidoMaterno: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido.'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;

export const licenciaSchema = z
  .object({
    ID_clase_licencia: z.number().int().positive(),
    numero_licencia: z.string().min(1).max(20),
    fecha_emision: fecha,
    fecha_vencimiento: fecha,
    url_archivo: z.string().max(500).optional(),
  })
  .refine((data) => data.fecha_vencimiento >= data.fecha_emision, {
    message: 'La fecha de vencimiento debe ser igual o posterior a la emision.',
    path: ['fecha_vencimiento'],
  });

export const verificarEmailSchema = z.object({
  token: z.string().length(64, 'Token invalido.'),
});

export const recuperarSchema = z.object({
  email: z.string().email('Email invalido.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().length(64, 'Token invalido.'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
});

export const perfilSchema = z
  .object({
    nombres: z.string().min(1, 'Nombres vacios.').optional(),
    apellidoPaterno: z.string().min(1, 'Apellido paterno vacio.').optional(),
    apellidoMaterno: z.string().optional(),
    telefono: z.string().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export type VerificarEmailInput = z.infer<typeof verificarEmailSchema>;
export type RecuperarInput = z.infer<typeof recuperarSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;
export type LicenciaInput = z.infer<typeof licenciaSchema>;
