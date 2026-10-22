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

export async function guardarFotoInspeccion(
  idArriendo: number,
  idInspeccion: number,
  buffer: Buffer,
): Promise<{ url: string; thumbUrl: string }> {
  const { webp, thumb } = await optimizeVehiclePhoto(buffer);
  const dir = path.join(env.UPLOAD_DIR, 'inspecciones', String(idArriendo), String(idInspeccion));
  await mkdir(dir, { recursive: true });

  const id = randomUUID();
  await writeFile(path.join(dir, `${id}.webp`), webp);
  await writeFile(path.join(dir, `${id}-thumb.webp`), thumb);

  return {
    url: `/uploads/inspecciones/${idArriendo}/${idInspeccion}/${id}.webp`,
    thumbUrl: `/uploads/inspecciones/${idArriendo}/${idInspeccion}/${id}-thumb.webp`,
  };
}

export async function guardarAdjuntoMensaje(
  idConversacion: number,
  originalName: string,
  buffer: Buffer,
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  const permitidas = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.avif']);
  const extension = permitidas.has(ext) ? ext : '.bin';
  const dir = path.join(env.UPLOAD_DIR, 'adjuntos', String(idConversacion));
  await mkdir(dir, { recursive: true });

  const id = randomUUID();
  await writeFile(path.join(dir, `${id}${extension}`), buffer);
  return `/uploads/adjuntos/${idConversacion}/${id}${extension}`;
}