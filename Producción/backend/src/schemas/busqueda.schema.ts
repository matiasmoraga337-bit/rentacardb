import { z } from 'zod';

export const guardarBusquedaSchema = z.object({
  nombre: z.string().trim().max(100).optional(),
  ID_comuna: z.number().int().positive().optional(),
  ID_tipo_vehiculo: z.number().int().positive().optional(),
  precio_maximo: z.number().positive().max(999999999).optional(),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type GuardarBusquedaInput = z.infer<typeof guardarBusquedaSchema>;
