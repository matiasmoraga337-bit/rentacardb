import { z } from 'zod';

export const crearConversacionSchema = z.object({
  ID_proveedor: z.number().int().positive(),
  ID_vehiculo: z.number().int().positive().optional(),
});

export const enviarMensajeSchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
  tipo_mensaje: z.literal('TEXTO').default('TEXTO'),
  ID_mensaje_padre: z.number().int().positive().optional(),
});

export type CrearConversacionInput = z.infer<typeof crearConversacionSchema>;
export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;
