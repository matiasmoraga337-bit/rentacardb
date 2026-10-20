import sharp from 'sharp';
import { AppError } from './AppError';

export interface OptimizedPhoto {
  webp: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
}

const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

/**
 * Valida, redimensiona y convierte una foto de vehiculo a WebP (sin metadatos).
 * Genera la version principal (<=1920px) y un thumbnail (<=480px).
 */
export async function optimizeVehiclePhoto(buffer: Buffer): Promise<OptimizedPhoto> {
  let format: string | undefined;
  try {
    const metadata = await sharp(buffer).metadata();
    format = metadata.format;
  } catch {
    throw new AppError(400, 'IMAGEN_INVALIDA', 'El archivo no es una imagen valida.');
  }

  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    throw new AppError(
      400,
      'FORMATO_NO_SOPORTADO',
      'Formato de imagen no soportado (usa JPG, PNG, WebP o AVIF).',
    );
  }

  const base = sharp(buffer).rotate();

  const main = await base
    .clone()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await base
    .clone()
    .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  return { webp: main.data, thumb, width: main.info.width, height: main.info.height };
}

export function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}
