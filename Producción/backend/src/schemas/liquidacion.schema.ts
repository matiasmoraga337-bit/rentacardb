import { z } from 'zod';

export const estadosLiquidacion = ['CALCULADA', 'APROBADA', 'PAGADA', 'ANULADA'] as const;

export const crearLiquidacionSchema = z.object({
  ID_proveedor: z.number().int().positive(),
  periodo_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodo_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const listarLiquidacionesQuerySchema = z.object({
  proveedor: z.coerce.number().int().positive().optional(),
  estado: z.enum(estadosLiquidacion).optional(),
  page: z.coerce.number().int().positive().max(100000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CrearLiquidacionInput = z.infer<typeof crearLiquidacionSchema>;
export type ListarLiquidacionesQuery = z.infer<typeof listarLiquidacionesQuerySchema>;
