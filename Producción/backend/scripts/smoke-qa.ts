/**
 * Verifica las cuentas y flotas creadas por seed:qa.
 * Uso: npm run smoke:qa (requiere API y seed:qa).
 */
import assert from 'node:assert/strict';
import { api, login } from './lib/demo-api';

interface ProveedorMio {
  id: number;
  nombreComercial: string;
}

interface VehiculoMio {
  id: number;
  patente: string;
}

interface BusquedaItem {
  ID_vehiculo: number;
  patente_vehiculo: string;
  nombre_region: string;
}

async function main(): Promise<void> {
  const admin = await login('admin@rentacar.cl', 'Admin1234!');
  const cliente2 = await login('cliente2@rentacar.cl', 'Cliente1234!');
  const flota = await login('flota@rentacar.cl', 'Flota1234!');
  const unico = await login('unico@rentacar.cl', 'Unico1234!');

  const proveedores = await api<{ id: number; nombreComercial: string }[]>(
    '/proveedores',
    {},
    admin.token,
  );
  const nombres = proveedores.map((proveedor) => proveedor.nombreComercial);
  assert(nombres.includes('Flota Chile'), 'Falta el proveedor Flota Chile.');
  assert(nombres.includes('Renta Natales'), 'Falta el proveedor Renta Natales.');

  const proveedorFlota = await api<ProveedorMio>('/proveedores/mio', {}, flota.token);
  assert.equal(proveedorFlota.nombreComercial, 'Flota Chile');

  const vehiculosFlota = await api<VehiculoMio[]>('/vehiculos/mios', {}, flota.token);
  assert.equal(vehiculosFlota.length, 16, `Flota Chile tiene ${vehiculosFlota.length}, se esperaban 16.`);

  const vehiculosUnico = await api<VehiculoMio[]>('/vehiculos/mios', {}, unico.token);
  assert.equal(vehiculosUnico.length, 1, `Renta Natales tiene ${vehiculosUnico.length}, se esperaba 1.`);

  const perfilCliente = await api<{ id: number; email: string }>(
    '/auth/me',
    {},
    cliente2.token,
  );
  assert.equal(perfilCliente.email, 'cliente2@rentacar.cl');

  const busqueda = await api<BusquedaItem[]>(
    '/vehiculos/buscar?pageSize=100',
    {},
    cliente2.token,
  );
  const regiones = new Set(busqueda.map((item) => item.nombre_region));
  assert(regiones.size >= 16, `Solo hay ${regiones.size} regiones en el catálogo.`);

  console.log('SMOKE QA OK');
  console.log(`  Proveedores: ${nombres.join(', ')}`);
  console.log(`  Flota Chile: ${vehiculosFlota.length} vehículos.`);
  console.log(`  Renta Natales: ${vehiculosUnico.length} vehículo.`);
  console.log(`  Regiones en catálogo: ${regiones.size}.`);
  console.log(`  Cliente2: ${perfilCliente.email}.`);
}

main().catch((error) => {
  console.error('SMOKE QA FAIL:', (error as Error).message);
  process.exitCode = 1;
});
