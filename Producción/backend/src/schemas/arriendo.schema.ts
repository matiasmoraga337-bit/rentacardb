import { z } from 'zod';

export const listarArriendosQuerySchema = z.object({
  scope: z.enum(['cliente', 'proveedor', 'todos']).optional(),
  estado: z.string().max(50).optional(),
  page: z.coerce.number().int().positive().max(100000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const iniciarArriendoSchema = z.object({
  ID_reserva: z.number().int().positive(),
  ID_sede_retiro_real: z.number().int().positive(),
  kilometraje_inicial: z.number().int().nonnegative(),
  combustible_inicial: z.number().min(0).max(100),
});

export const devolucionArriendoSchema = z.object({
  ID_sede_devolucion_real: z.number().int().positive(),
  kilometraje_final: z.number().int().nonnegative(),
  combustible_final: z.number().min(0).max(100),
  limpieza: z.enum(['BUENA', 'REGULAR', 'MALA']).optional(),
  observaciones: z.string().max(1000).optional(),
});

export const danoInspeccionSchema = z.object({
  zona: z.string().min(1).max(50),
  tipo: z.string().min(1).max(50),
  severidad: z.enum(['LEVE', 'MEDIO', 'GRAVE']),
  descripcion: z.string().max(500).optional(),
  monto_estimado: z.number().nonnegative().optional(),
});

export const conductorAdicionalSchema = z.object({
  rut: z.string().trim().min(3).max(12),
  ID_licencia_conducir: z.number().int().positive().optional(),
});

export const aceptarContratoSchema = z.object({
  aceptado: z.literal(true),
});

export type ListarArriendosQuery = z.infer<typeof listarArriendosQuerySchema>;
export type IniciarArriendoInput = z.infer<typeof iniciarArriendoSchema>;
export type DevolucionArriendoInput = z.infer<typeof devolucionArriendoSchema>;
export type DanoInspeccionInput = z.infer<typeof danoInspeccionSchema>;
export type ConductorAdicionalInput = z.infer<typeof conductorAdicionalSchema>;
