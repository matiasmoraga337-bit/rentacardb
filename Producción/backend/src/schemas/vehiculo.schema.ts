import { z } from 'zod';
import { esFechaValida } from '../utils/dates';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido (YYYY-MM-DD).')
  .refine(esFechaValida, 'La fecha no existe en el calendario.');

export const registrarVehiculoSchema = z.object({
  ID_modelo: z.number().int().positive(),
  ID_tipo_vehiculo: z.number().int().positive(),
  ID_tipo_combustible: z.number().int().positive(),
  ID_tipo_transmision: z.number().int().positive(),
  patente: z.string().min(4).max(10),
  vin: z.string().length(17, 'El VIN debe tener 17 caracteres.'),
  anio: z.number().int().min(1950),
  kilometraje: z.number().int().nonnegative(),
  precioDiarioBase: z.number().positive(),
  ID_sede_actual: z.number().int().positive().optional(),
});

export const actualizarVehiculoSchema = z
  .object({
    ID_modelo: z.number().int().positive().optional(),
    ID_tipo_vehiculo: z.number().int().positive().optional(),
    ID_tipo_combustible: z.number().int().positive().optional(),
    ID_tipo_transmision: z.number().int().positive().optional(),
    ID_estado_vehiculo: z.number().int().positive().optional(),
    ID_sede_actual: z.number().int().positive().optional(),
    anio: z.number().int().min(1950).optional(),
    kilometraje: z.number().int().nonnegative().optional(),
    precioDiarioBase: z.number().positive().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debe enviar al menos un campo.',
  });

export const tarifaCreateSchema = z.object({
  nombre: z.string().min(1),
  fechaInicio: fecha,
  fechaFin: fecha,
  precioDia: z.number().positive(),
  prioridad: z.number().int().positive().optional(),
  diaSemana: z.number().int().min(1).max(7).optional(),
  anticipacionMin: z.number().int().nonnegative().optional(),
  anticipacionMax: z.number().int().nonnegative().optional(),
  diasMinimos: z.number().int().positive().optional(),
  diasMaximos: z.number().int().positive().optional(),
});

export const tarifaUpdateSchema = tarifaCreateSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debe enviar al menos un campo.',
  });

export const caracteristicaSchema = z.object({
  ID_caracteristica: z.number().int().positive(),
  disponible: z.boolean().optional(),
});

export const documentoCreateSchema = z.object({
  ID_tipo_documento: z.coerce.number().int().positive(),
  numero: z.string().optional(),
  fechaEmision: fecha.optional(),
  fechaVencimiento: fecha,
});

export type RegistrarVehiculoInput = z.infer<typeof registrarVehiculoSchema>;
export type ActualizarVehiculoInput = z.infer<typeof actualizarVehiculoSchema>;
export type TarifaCreateInput = z.infer<typeof tarifaCreateSchema>;
export type TarifaUpdateInput = z.infer<typeof tarifaUpdateSchema>;
export type DocumentoCreateInput = z.infer<typeof documentoCreateSchema>;
export const mantenimientoCreateSchema = z.object({
  ID_tipo_mantenimiento: z.number().int().positive(),
  kilometraje: z.number().int().nonnegative(),
  descripcion: z.string().max(500).optional(),
  taller: z.string().max(150).optional(),
  costo: z.number().nonnegative().optional(),
});

export const mantenimientoFinalizarSchema = z.object({
  costo_final: z.number().nonnegative().optional(),
});

export type MantenimientoCreateInput = z.infer<typeof mantenimientoCreateSchema>;
export type MantenimientoFinalizarInput = z.infer<typeof mantenimientoFinalizarSchema>;
