/**
 * Sube fotos de stock a los vehiculos demo y de QA.
 * Uso: npm run seed:fotos (requiere API, `npm run seed` y `npm run seed:qa`).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { api, login, subirArchivos } from './lib/demo-api';

interface VehiculoMio {
  id: number;
  patente: string;
}

interface GrupoFotos {
  email: string;
  password: string;
  fotos: { patente: string; archivos: string[] }[];
}

const GRUPOS: GrupoFotos[] = [
  {
    email: 'proveedor@rentacar.cl',
    password: 'Proveedor1234!',
    fotos: [
      { patente: 'DEMA01', archivos: ['corolla-1.webp', 'corolla-2.webp', 'corolla-3.webp'] },
      { patente: 'DEMB02', archivos: ['tucson-1.webp', 'tucson-2.webp', 'tucson-3.webp'] },
    ],
  },
  {
    email: 'flota@rentacar.cl',
    password: 'Flota1234!',
    fotos: [
      'FLAA01', 'FLAA02', 'FLAA03', 'FLAA04', 'FLAA05', 'FLAA06', 'FLAA07', 'FLAA08',
      'FLAA09', 'FLAA10', 'FLAA11', 'FLAA12', 'FLAA13', 'FLAA14', 'FLAA15', 'FLAA16',
    ].map((patente) => ({ patente, archivos: [`qa/${patente}-1.webp`] })),
  },
  {
    email: 'unico@rentacar.cl',
    password: 'Unico1234!',
    fotos: [{ patente: 'UNAA01', archivos: ['qa/UNAA01-1.webp'] }],
  },
];

async function main(): Promise<void> {
  for (const grupo of GRUPOS) {
    let proveedor;
    try {
      proveedor = await login(grupo.email, grupo.password);
    } catch (error) {
      console.log(
        `SKIP ${grupo.email}: ${(error as Error).message}. Ejecuta npm run seed:qa si faltan las cuentas QA.`,
      );
      continue;
    }
    const vehiculos = await api<VehiculoMio[]>('/vehiculos/mios', {}, proveedor.token);

    for (const item of grupo.fotos) {
      const vehiculo = vehiculos.find((vehiculoMio) => vehiculoMio.patente === item.patente);
      if (!vehiculo) {
        throw new Error(
          `No se encontro ${item.patente} para ${grupo.email}. Ejecuta npm run seed:qa.`,
        );
      }

      const detalle = await api<{ fotos: { id: number }[] }>(
        `/vehiculos/${vehiculo.id}`,
      );
      if (detalle.fotos.length > 0) {
        console.log(`SKIP ${item.patente}: ya tiene ${detalle.fotos.length} foto(s).`);
        continue;
      }

      const files = await Promise.all(
        item.archivos.map(async (nombre) => {
          const buffer = await readFile(path.join(__dirname, 'assets', 'vehiculos', nombre));
          return {
            blob: new Blob([new Uint8Array(buffer)], { type: 'image/webp' }),
            nombre: path.basename(nombre),
          };
        }),
      );

      await subirArchivos(
        `/vehiculos/${vehiculo.id}/fotos`,
        'fotos',
        files,
        proveedor.token,
      );
      console.log(`OK   ${item.patente}: ${files.length} foto(s) subida(s).`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
