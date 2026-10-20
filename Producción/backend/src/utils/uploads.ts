import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { optimizeVehiclePhoto } from './images';

export async function guardarFotoVehiculo(
  idVehiculo: number,
  buffer: Buffer,
): Promise<{ url: string; thumbUrl: string }> {
  const { webp, thumb } = await optimizeVehiclePhoto(buffer);
  const dir = path.join(env.UPLOAD_DIR, 'vehiculos', String(idVehiculo));
  await mkdir(dir, { recursive: true });

  const id = randomUUID();
  await writeFile(path.join(dir, `${id}.webp`), webp);
  await writeFile(path.join(dir, `${id}-thumb.webp`), thumb);

  return {
    url: `/uploads/vehiculos/${idVehiculo}/${id}.webp`,
    thumbUrl: `/uploads/vehiculos/${idVehiculo}/${id}-thumb.webp`,
  };
}

export async function guardarDocumento(idVehiculo: number, buffer: Buffer): Promise<string> {
  const dir = path.join(env.UPLOAD_DIR, 'documentos', String(idVehiculo));
  await mkdir(dir, { recursive: true });

  const id = randomUUID();
  await writeFile(path.join(dir, `${id}.pdf`), buffer);
  return `/uploads/documentos/${idVehiculo}/${id}.pdf`;
}
