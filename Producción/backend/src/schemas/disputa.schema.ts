import { z } from 'zod';

export const tiposDisputa = ['DANO', 'COBRO', 'SERVICIO', 'DOCUMENTO', 'OTRO'] as const;
export const estadosDisputa = ['ABIERTA', 'EN_REVISION', 'RESUELTA', 'CERRADA'] as const;

export const crearDisputaSchema = z.object({
  ID_arriendo: z.number().int().positive(),
  tipo_disputa: z.enum(tiposDisputa),
  descripcion: z.string().trim().min(10).max(1000),
  monto_disputado: z.number().positive().max(999999999).optional(),
});

export const resolverDisputaSchema = z.object({
  estado: z.enum(['EN_REVISION', 'RESUELTA', 'CERRADA']),
  resolucion: z.string().trim().min(10).max(1000).optional(),
});

export const listarDisputasQuerySchema = z.object({
  scope: z.enum(['cliente', 'proveedor', 'todos']).optional(),
  estado: z.enum(estadosDisputa).optional(),
  arriendo: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().max(100000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CrearDisputaInput = z.infer<typeof crearDisputaSchema>;
export type ResolverDisputaInput = z.infer<typeof resolverDisputaSchema>;
export type ListarDisputasQuery = z.infer<typeof listarDisputasQuerySchema>;
export type TipoDisputa = (typeof tiposDisputa)[number];
