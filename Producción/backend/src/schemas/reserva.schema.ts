import { z } from 'zod';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido (YYYY-MM-DD).');

export const crearReservaSchema = z
  .object({
    ID_vehiculo: z.number().int().positive(),
    ID_sede_retiro: z.number().int().positive(),
    ID_sede_devolucion: z.number().int().positive(),
    fecha_inicio: fecha,
    fecha_fin: fecha,
    observaciones: z.string().max(500).optional(),
    politica_combustible: z.enum(['LLENO_LLENO', 'MISMO_NIVEL', 'LIBRE']).optional(),
    km_incluidos_dia: z.number().int().nonnegative().optional(),
    cargo_km_excedido: z.number().nonnegative().optional(),
    idempotency_key: z.string().min(8).max(100).optional(),
  })
  .refine((data) => data.fecha_fin > data.fecha_inicio, {
    message: 'La fecha de devolucion debe ser posterior al retiro.',
    path: ['fecha_fin'],
  });

export const cancelarReservaSchema = z.object({
  motivo: z.string().min(3).max(500),
  solicitar_reembolso: z.boolean().default(false),
  motivo_reembolso: z.string().min(3).max(500).optional(),
  idempotency_key: z.string().min(8).max(100).optional(),
  referencia_externa: z.string().max(150).optional(),
});

export const cambiarEstadoReservaSchema = z.object({
  estado: z.enum(['CONFIRMADA', 'CANCELADA', 'EXPIRADA']),
  motivo: z.string().max(500).optional(),
});

export const listarReservasQuerySchema = z.object({
  scope: z.enum(['cliente', 'proveedor', 'todos']).optional(),
  estado: z.string().max(50).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
export type CancelarReservaInput = z.infer<typeof cancelarReservaSchema>;
export type CambiarEstadoReservaInput = z.infer<typeof cambiarEstadoReservaSchema>;
export type ListarReservasQuery = z.infer<typeof listarReservasQuerySchema>;
