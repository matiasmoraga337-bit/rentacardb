import { z } from 'zod';

export const catalogoTipos = [
  'marcas',
  'modelos',
  'tipos-vehiculo',
  'combustibles',
  'transmisiones',
  'caracteristicas',
  'tipos-documento',
  'politicas-cancelacion',
] as const;

export const catalogoTiposLectura = [
  'tipos-proveedor',
  'estados-vehiculo',
  'estados-publicacion',
] as const;

export type CatalogoTipo = (typeof catalogoTipos)[number];
export type CatalogoTipoLectura = (typeof catalogoTiposLectura)[number];

const nombre = z.string().trim().min(1).max(100);
const activo = z.boolean().optional();

export const catalogosSchema = {
  marcas: z.object({ nombre, activo }),
  modelos: z.object({
    ID_marca_modelo: z.number().int().positive(),
    nombre,
    activo,
  }),
  'tipos-vehiculo': z.object({ nombre, activo }),
  combustibles: z.object({ nombre, activo }),
  transmisiones: z.object({ nombre, activo }),
  caracteristicas: z.object({
    nombre,
    categoria: z.string().trim().min(1).max(30),
    descripcion: z.string().trim().max(200).optional(),
    activo,
  }),
  'tipos-documento': z.object({
    nombre,
    obligatorio: z.boolean().optional(),
    activo,
  }),
  'politicas-cancelacion': z.object({
    nombre,
    descripcion: z.string().trim().max(300).optional(),
    dias_anticipacion: z.number().int().min(0).max(365),
    porcentaje_reembolso: z.number().min(0).max(100),
    activo,
  }),
} as const;

export type CatalogoBody = z.infer<(typeof catalogosSchema)[CatalogoTipo]>;

export function isCatalogoTipo(value: string): value is CatalogoTipo {
  return (catalogoTipos as readonly string[]).includes(value);
}

export function isCatalogoLectura(value: string): value is CatalogoTipoLectura {
  return (catalogoTiposLectura as readonly string[]).includes(value);
}

export function schemaDeCatalogo(tipo: CatalogoTipo): z.ZodTypeAny {
  return catalogosSchema[tipo];
}
