import { z } from 'zod';

export const tiposResena = [
  'CLIENTE_A_PROVEEDOR',
  'CLIENTE_A_VEHICULO',
  'PROVEEDOR_A_CLIENTE',
] as const;

export const crearResenaSchema = z.object({
  ID_arriendo: z.number().int().positive(),
  tipo_resena: z.enum(tiposResena),
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

export type TipoResena = (typeof tiposResena)[number];
export type CrearResenaInput = z.infer<typeof crearResenaSchema>;
