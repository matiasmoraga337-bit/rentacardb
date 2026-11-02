import { z } from 'zod';

export const registrarProveedorSchema = z
  .object({
    tipo: z.enum(['PERSONA', 'EMPRESA']),
    nombreComercial: z.string().min(1, 'Nombre comercial obligatorio.'),
    razonSocial: z.string().optional(),
    rutProveedor: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email invalido.').optional(),
  })
  .refine(
    (data) => data.tipo !== 'EMPRESA' || Boolean(data.razonSocial && data.rutProveedor),
    { message: 'Una empresa requiere razonSocial y rutProveedor.', path: ['razonSocial'] },
  );


const cuentaProveedorSchema = z.object({
  rut: z.string().min(3, 'RUT invalido.'),
  nombres: z.string().min(1, 'Nombres obligatorios.'),
  apellidoPaterno: z.string().min(1, 'Apellido paterno obligatorio.'),
  apellidoMaterno: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido.'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
});

const proveedorPublicoSchema = z
  .object({
    tipo: z.enum(['PERSONA', 'EMPRESA']),
    nombreComercial: z.string().min(1, 'Nombre comercial obligatorio.'),
    razonSocial: z.string().optional(),
    rutProveedor: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email invalido.').optional(),
  })
  .refine(
    (data) => data.tipo !== 'EMPRESA' || Boolean(data.razonSocial && data.rutProveedor),
    { message: 'Una empresa requiere razonSocial y rutProveedor.', path: ['razonSocial'] },
  );

export const registroProveedorPublicoSchema = z.object({
  cuenta: cuentaProveedorSchema,
  proveedor: proveedorPublicoSchema,
});

export const cambiarEstadoProveedorSchema = z
  .object({
    estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO', 'INACTIVO']),
    motivo: z.string().max(300).optional(),
  })
  .refine(
    (data) =>
      !['RECHAZADO', 'SUSPENDIDO', 'INACTIVO'].includes(data.estado) ||
      Boolean(data.motivo && data.motivo.trim().length > 0),
    { message: 'El motivo es obligatorio para este estado.', path: ['motivo'] },
  );

export const configuracionSchema = z
  .object({
    permite_devolucion_otra_sede: z.boolean().optional(),
    permite_entrega_domicilio: z.boolean().optional(),
    permite_retiro_domicilio: z.boolean().optional(),
    radio_maximo_km: z.number().nonnegative().optional(),
    minutos_expiracion_reserva: z.number().int().positive().optional(),
    edad_minima_arriendo: z.number().int().nonnegative().optional(),
    requiere_deposito: z.boolean().optional(),
    monto_deposito: z.number().nonnegative().optional(),
    dias_minimos_arriendo: z.number().int().positive().optional(),
    dias_maximos_arriendo: z.number().int().positive().optional(),
    moneda_operacion: z.string().length(3).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debe enviar al menos un campo.',
  });

export const sedeCreateSchema = z.object({
  ID_comuna: z.number().int().positive(),
  nombre: z.string().min(1, 'Nombre obligatorio.'),
  direccion: z.string().min(1, 'Direccion obligatoria.'),
  telefono: z.string().optional(),
  email: z.string().email('Email invalido.').optional(),
  activo: z.boolean().optional(),
});

export const sedeUpdateSchema = z
  .object({
    ID_comuna: z.number().int().positive().optional(),
    nombre: z.string().min(1).optional(),
    direccion: z.string().min(1).optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email invalido.').optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debe enviar al menos un campo.',
  });

export type RegistrarProveedorInput = z.infer<typeof registrarProveedorSchema>;
export type RegistroProveedorPublicoInput = z.infer<typeof registroProveedorPublicoSchema>;
export type CambiarEstadoProveedorInput = z.infer<typeof cambiarEstadoProveedorSchema>;
export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
export type SedeCreateInput = z.infer<typeof sedeCreateSchema>;
export type SedeUpdateInput = z.infer<typeof sedeUpdateSchema>;
