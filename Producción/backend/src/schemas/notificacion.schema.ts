import { z } from 'zod';

export const estadosNotificacion = ['PENDIENTE', 'ENVIADA', 'FALLIDA', 'LEIDA'] as const;

export const listarNotificacionesQuerySchema = z.object({
  estado: z.enum(estadosNotificacion).optional(),
  page: z.coerce.number().int().positive().max(100000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListarNotificacionesQuery = z.infer<typeof listarNotificacionesQuerySchema>;
