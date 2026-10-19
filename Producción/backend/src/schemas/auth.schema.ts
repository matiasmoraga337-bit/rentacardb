import { z } from 'zod';

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
