/**
 * Sube fotos de stock a los vehiculos demo existentes.
 * Uso: npm run seed:fotos (requiere API y `npm run seed`).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { api, login, subirArchivos } from './lib/demo-api';

const PROVEEDOR_EMAIL = process.env.SMOKE_PROVEEDOR_EMAIL ?? 'proveedor@rentacar.cl';
const PROVEEDOR_PASSWORD = process.env.SMOKE_PROVEEDOR_PASSWORD ?? 'Proveedor1234!';

const FOTOS_DEMO = [
  { patente: 'DEMA01', archivos: ['corolla-1.webp', 'corolla-2.webp', 'corolla-3.webp'] },
  { patente: 'DEMB02', archivos: ['tucson-1.webp', 'tucson-2.webp', 'tucson-3.webp'] },
];

interface VehiculoBusqueda {
  ID_vehiculo: number;
  patente_vehiculo: string;
}

async function main(): Promise<void> {
  const proveedor = await login(PROVEEDOR_EMAIL, PROVEEDOR_PASSWORD);
  const vehiculos = await api<VehiculoBusqueda[]>('/vehiculos/buscar');

  for (const grupo of FOTOS_DEMO) {
    const vehiculo = vehiculos.find((item) => item.patente_vehiculo === grupo.patente);
    if (!vehiculo) {
      throw new Error(`No se encontro el vehiculo ${grupo.patente}. Ejecuta npm run seed.`);
    }

    const detalle = await api<{ fotos: { id: number }[] }>(
      `/vehiculos/${vehiculo.ID_vehiculo}`,
    );
    if (detalle.fotos.length > 0) {
      console.log(`SKIP ${grupo.patente}: ya tiene ${detalle.fotos.length} foto(s).`);
      continue;
    }

    const files = await Promise.all(
      grupo.archivos.map(async (nombre) => {
        const buffer = await readFile(path.join(__dirname, 'assets', 'vehiculos', nombre));
        return {
          blob: new Blob([new Uint8Array(buffer)], { type: 'image/webp' }),
          nombre,
        };
      }),
    );

    await subirArchivos(
      `/vehiculos/${vehiculo.ID_vehiculo}/fotos`,
      'fotos',
      files,
      proveedor.token,
    );
    console.log(`OK   ${grupo.patente}: ${files.length} fotos subidas.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
