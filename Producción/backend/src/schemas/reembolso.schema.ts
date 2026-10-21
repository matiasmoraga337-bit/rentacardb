import { z } from 'zod';

export const crearReembolsoSchema = z.object({
  ID_reserva: z.number().int().positive(),
  monto: z.number().positive(),
  motivo: z.string().min(3).max(500),
  idempotency_key: z.string().min(8).max(100),
});

export const completarReembolsoSchema = z.object({
  referencia_externa: z.string().max(150).optional(),
});

export const listarReembolsosQuerySchema = z.object({
  reserva: z.coerce.number().int().positive(),
});

export type CrearReembolsoInput = z.infer<typeof crearReembolsoSchema>;
export type CompletarReembolsoInput = z.infer<typeof completarReembolsoSchema>;
export type ListarReembolsosQuery = z.infer<typeof listarReembolsosQuerySchema>;
