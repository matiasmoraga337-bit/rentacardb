/**
 * Smoke S4 completo contra una API en ejecucion.
 * Uso: npm run smoke:s4   (requiere `npm run seed` y API levantada)
 */
import assert from 'node:assert/strict';
import {
  api,
  construirArriendoFinalizado,
  fechaLocal,
  login,
  pngDemo,
  subirArchivos,
} from './lib/demo-api';

const stamp = Date.now();
const CLIENTE_EMAIL = process.env.SMOKE_EMAIL ?? 'demo@rentacar.cl';
const CLIENTE_PASSWORD = process.env.SMOKE_PASSWORD ?? 'Demo1234!';
const PROVEEDOR_EMAIL = process.env.SMOKE_PROVEEDOR_EMAIL ?? 'proveedor@rentacar.cl';
const PROVEEDOR_PASSWORD = process.env.SMOKE_PROVEEDOR_PASSWORD ?? 'Proveedor1234!';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@rentacar.cl';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin1234!';

interface Arriendo {
  id: number;
  vehiculoId: number;
  proveedorId: number;
  inspecciones: { id: number; tipo: string; fotos: { id: number }[] }[];
  cargos: { tipo: string | null; monto: number }[];
  multas: { id: number; monto: number }[];
  resenas: { tipo: string }[];
}

async function main(): Promise<void> {
  console.log('Smoke S4 contra la API...');
  const cliente = await login(CLIENTE_EMAIL, CLIENTE_PASSWORD);
  const proveedor = await login(PROVEEDOR_EMAIL, PROVEEDOR_PASSWORD);
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('PASS login cliente, proveedor y admin');

  const nombreMarca = `SMOKE-S4-MARCA-${stamp}`;
  const marca = await api<{ id: number; nombre: string; activo: boolean }>(
    '/admin/catalogos/marcas',
    {
      method: 'POST',
      body: JSON.stringify({ nombre: nombreMarca, activo: true }),
    },
    admin.token,
  );
  assert.equal(marca.nombre, nombreMarca);
  await api(
    `/admin/catalogos/marcas/${marca.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ nombre: `${nombreMarca}-EDIT`, activo: true }),
    },
    admin.token,
  );
  const marcaDesactivada = await api<{ activo: boolean }>(
    `/admin/catalogos/marcas/${marca.id}`,
    { method: 'DELETE' },
    admin.token,
  );
  assert.equal(marcaDesactivada.activo, false);
  console.log('PASS catalogos admin (crear/editar/desactivar)');

  const creado = await construirArriendoFinalizado({
    clienteToken: cliente.token,
    proveedorToken: proveedor.token,
    adminToken: admin.token,
    observaciones: `SMOKE-S4-${stamp}`,
    offsetDias: 400 + (stamp % 100),
  });
  const arriendo = await api<Arriendo>(
    `/arriendos/${creado.arriendoId}`,
    {},
    proveedor.token,
  );
  assert.ok(arriendo.cargos.some((cargo) => cargo.tipo === 'LIMPIEZA'));
  assert.ok(arriendo.multas.length > 0);
  assert.ok(arriendo.resenas.length > 0);
  console.log(`PASS arriendo ${arriendo.id} con cargos, multa y resenas`);

  await api(`/favoritos/${arriendo.vehiculoId}`, { method: 'POST' }, cliente.token);
  const favoritos = await api<{ vehiculoId: number }[]>('/favoritos', {}, cliente.token);
  assert.ok(favoritos.some((item) => item.vehiculoId === arriendo.vehiculoId));
  await api(`/favoritos/${arriendo.vehiculoId}`, { method: 'DELETE' }, cliente.token);
  console.log('PASS favoritos');

  const busqueda = await api<{ id: number; nombre: string | null }>(
    '/busquedas',
    {
      method: 'POST',
      body: JSON.stringify({ nombre: `SMOKE-S4-${stamp}`, precio_maximo: 50000 }),
    },
    cliente.token,
  );
  const busquedas = await api<{ id: number }[]>('/busquedas', {}, cliente.token);
  assert.ok(busquedas.some((item) => item.id === busqueda.id));
  await api(`/busquedas/${busqueda.id}`, { method: 'DELETE' }, cliente.token);
  console.log('PASS busquedas guardadas');

  const disputa = await api<{ id: number; estado: string }>(
    '/disputas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendo.id,
        tipo_disputa: 'DANO',
        descripcion: 'Disputa del smoke S4 sobre el cargo de dano.',
        monto_disputado: 15000,
      }),
    },
    cliente.token,
  );
  assert.equal(disputa.estado, 'ABIERTA');
  await api(
    `/disputas/${disputa.id}/resolver`,
    { method: 'POST', body: JSON.stringify({ estado: 'EN_REVISION' }) },
    admin.token,
  );
  const disputaResuelta = await api<{ estado: string }>(
    `/disputas/${disputa.id}/resolver`,
    {
      method: 'POST',
      body: JSON.stringify({
        estado: 'RESUELTA',
        resolucion: 'Disputa resuelta en smoke S4.',
      }),
    },
    admin.token,
  );
  assert.equal(disputaResuelta.estado, 'RESUELTA');
  console.log('PASS disputas');

  const liquidaciones = await api<{ data: { id: number; estado: string; periodoInicio: string; periodoFin: string }[] }>(
    `/liquidaciones?proveedor=${arriendo.proveedorId}&pageSize=50`,
    {},
    admin.token,
  );
  let liquidacion: { id: number; estado: string } | undefined = liquidaciones.data.find(
    (item) => item.periodoInicio <= fechaLocal(0) && item.periodoFin >= fechaLocal(0),
  );
  if (!liquidacion) {
    liquidacion = await api<{ id: number; estado: string }>(
      '/liquidaciones',
      {
        method: 'POST',
        body: JSON.stringify({
          ID_proveedor: arriendo.proveedorId,
          periodo_inicio: '2020-01-01',
          periodo_fin: '2030-12-31',
        }),
      },
      admin.token,
    );
  }
  if (liquidacion.estado === 'CALCULADA') {
    liquidacion = await api<{ id: number; estado: string }>(
      `/liquidaciones/${liquidacion.id}/aprobar`,
      { method: 'POST' },
      admin.token,
    );
  }
  if (liquidacion.estado === 'APROBADA') {
    liquidacion = await api<{ id: number; estado: string }>(
      `/liquidaciones/${liquidacion.id}/pagar`,
      { method: 'POST' },
      admin.token,
    );
  }
  assert.ok(['APROBADA', 'PAGADA'].includes(liquidacion.estado));
  console.log(`PASS liquidacion ${liquidacion.id} (${liquidacion.estado})`);

  const notificaciones = await api<{ total: number }>('/notificaciones/no-leidas', {}, cliente.token);
  assert.ok(notificaciones.total >= 0);
  const listaNotificaciones = await api<{ data: { id: number; estado: string }[] }>(
    '/notificaciones?page=1&pageSize=5',
    {},
    cliente.token,
  );
  if (listaNotificaciones.data.length > 0) {
    await api(`/notificaciones/${listaNotificaciones.data[0].id}/leer`, { method: 'POST' }, cliente.token);
  }
  const outbox = await api<{ data: unknown[]; total: number }>(
    '/admin/outbox?page=1&pageSize=5',
    {},
    admin.token,
  );
  assert.ok(Array.isArray(outbox.data));
  console.log('PASS notificaciones y outbox');

  const inspeccion = arriendo.inspecciones.find((item) => item.tipo === 'DEVOLUCION');
  assert.ok(inspeccion);
  const png = await pngDemo();
  await subirArchivos(
    `/arriendos/${arriendo.id}/inspecciones/${inspeccion.id}/fotos`,
    'fotos',
    [png],
    proveedor.token,
  );
  const arriendoConFoto = await api<Arriendo>(`/arriendos/${arriendo.id}`, {}, proveedor.token);
  const inspeccionConFoto = arriendoConFoto.inspecciones.find((item) => item.id === inspeccion.id);
  assert.ok(inspeccionConFoto && inspeccionConFoto.fotos.length > 0);
  console.log('PASS foto de inspeccion');

  const conversacion = await api<{ id: number }>(
    '/conversaciones',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_proveedor: arriendo.proveedorId,
        ID_vehiculo: arriendo.vehiculoId,
      }),
    },
    cliente.token,
  );
  const mensaje = await api<{ id: number }>(
    `/conversaciones/${conversacion.id}/mensajes`,
    { method: 'POST', body: JSON.stringify({ contenido: `Adjunto smoke S4 ${stamp}` }) },
    cliente.token,
  );
  await subirArchivos(
    `/conversaciones/${conversacion.id}/mensajes/${mensaje.id}/adjuntos`,
    'archivos',
    [png],
    cliente.token,
  );
  const mensajes = await api<{ id: number; adjuntos: unknown[] }[]>(
    `/conversaciones/${conversacion.id}/mensajes`,
    {},
    cliente.token,
  );
  assert.ok(mensajes.some((item) => item.id === mensaje.id && item.adjuntos.length > 0));
  console.log('PASS adjuntos de chat');

  console.log('SMOKE S4 OK');
}

main().catch((err: unknown) => {
  console.error('SMOKE S4 FAIL:', (err as Error).message);
  process.exit(1);
});
