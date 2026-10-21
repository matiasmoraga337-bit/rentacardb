import { z } from 'zod';

export const registrarPagoSchema = z.object({
  ID_reserva: z.number().int().positive(),
  ID_tipo_operacion_pago: z.number().int().positive(),
  ID_metodo_pago: z.number().int().positive(),
  monto_pago: z.number().positive(),
  aprobado: z.boolean(),
  referencia: z.string().max(100).optional(),
  ID_arriendo: z.number().int().positive().optional(),
  ID_cargo_extra: z.number().int().positive().optional(),
});

export const iniciarWebPaySchema = z.object({
  ID_reserva: z.number().int().positive(),
});

export const confirmarWebPaySchema = z.object({
  token_ws: z
    .string()
    .length(64, 'Token WebPay invalido.')
    .regex(/^[0-9A-Fa-f]{64}$/, 'Token WebPay invalido.'),
  aprobada: z.boolean().default(true),
});

export const listarPagosQuerySchema = z.object({
  reserva: z.coerce.number().int().positive(),
});

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type IniciarWebPayInput = z.infer<typeof iniciarWebPaySchema>;
export type ConfirmarWebPayInput = z.infer<typeof confirmarWebPaySchema>;
export type ListarPagosQuery = z.infer<typeof listarPagosQuerySchema>;
