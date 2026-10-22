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
  verificarUrl,
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
  inspecciones: { id: number; tipo: string; fotos: { id: number; url: string }[] }[];
  cargos: { tipo: string | null; monto: number }[];
  multas: { id: number; monto: number }[];
  resenas: { tipo: string }[];
}

const EXPECT_OUTBOX = process.env.SMOKE_EXPECT_OUTBOX === '1';

async function esperarOutboxProcesado(adminToken: string): Promise<boolean> {
  for (let intento = 0; intento < 15; intento += 1) {
    const outbox = await api<{ total: number }>(
      '/admin/outbox?estado=PROCESADO&page=1&pageSize=1',
      {},
      adminToken,
    );
    if (outbox.total > 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function main(): Promise<void> {
  console.log('Smoke S4 contra la API...');
  const cliente = await login(CLIENTE_EMAIL, CLIENTE_PASSWORD);
  const proveedor = await login(PROVEEDOR_EMAIL, PROVEEDOR_PASSWORD);
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('PASS login cliente, proveedor y admin');

  const nombreMarca = 'SMOKE-S4-MARCA';
  const marcas = await api<{ id: number; nombre: string; activo: boolean }[]>(
    '/admin/catalogos/marcas?incluirInactivos=1',
    {},
    admin.token,
  );
  const existente = marcas.find((item) => item.nombre === nombreMarca);
  const marca = existente
    ? await api<{ id: number; nombre: string; activo: boolean }>(
        `/admin/catalogos/marcas/${existente.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ nombre: nombreMarca, activo: true }),
        },
        admin.token,
      )
    : await api<{ id: number; nombre: string; activo: boolean }>(
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
      body: JSON.stringify({ nombre: nombreMarca, activo: true }),
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

  let creado: Awaited<ReturnType<typeof construirArriendoFinalizado>> | undefined;
  for (let intento = 1; intento <= 3; intento += 1) {
    try {
      creado = await construirArriendoFinalizado({
        clienteToken: cliente.token,
        proveedorToken: proveedor.token,
        prefijoResena: `SMOKE-S4-${stamp}`,
        observaciones: `SMOKE-S4-${stamp}`,
        offsetDias: 300 + Math.floor(Math.random() * 200),
      });
      break;
    } catch (error) {
      const code = (error as { code?: string }).code;
      const solapada = code === 'RESERVA_SOLAPADA' || code === '70209' || code === '70900';
      if (!solapada || intento === 3) throw error;
      console.log(`Reintentando arriendo por solapamiento (intento ${intento + 1})...`);
    }
  }
  if (!creado) throw new Error('No se pudo crear el arriendo de smoke.');
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

  const listaNotificaciones = await api<{
    data: { id: number; estado: string }[];
    total: number;
  }>('/notificaciones?page=1&pageSize=20', {}, cliente.token);
  assert.ok(
    listaNotificaciones.data.length > 0,
    'El flujo no genero notificaciones para el cliente.',
  );
  const noLeida = listaNotificaciones.data.find((item) => item.estado !== 'LEIDA');
  if (noLeida) {
    await api(`/notificaciones/${noLeida.id}/leer`, { method: 'POST' }, cliente.token);
    const actualizadas = await api<{ data: { id: number; estado: string }[] }>(
      '/notificaciones?page=1&pageSize=20',
      {},
      cliente.token,
    );
    assert.equal(
      actualizadas.data.find((item) => item.id === noLeida.id)?.estado,
      'LEIDA',
      'La notificacion no cambio a LEIDA.',
    );
    console.log('PASS notificaciones (marcar leida)');
  } else {
    console.log('PASS notificaciones (sin pendientes para marcar)');
  }

  const outbox = await api<{ total: number }>(
    '/admin/outbox?page=1&pageSize=1',
    {},
    admin.token,
  );
  assert.ok(outbox.total > 0, 'No hay eventos en outbox.');
  if (EXPECT_OUTBOX) {
    const procesado = await esperarOutboxProcesado(admin.token);
    assert.ok(procesado, 'No se encontro un evento PROCESADO en outbox.');
    console.log('PASS outbox worker (evento PROCESADO)');
  } else {
    console.log('SKIP outbox worker (SMOKE_EXPECT_OUTBOX no activo)');
  }

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
  const fotoStatus = await verificarUrl(inspeccionConFoto.fotos[0].url);
  assert.equal(fotoStatus, 200, `La foto no responde 200 (status ${fotoStatus}).`);
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
  const mensajes = await api<{ id: number; adjuntos: { url: string }[] }[]>(
    `/conversaciones/${conversacion.id}/mensajes`,
    {},
    cliente.token,
  );
  const mensajeConAdjunto = mensajes.find(
    (item) => item.id === mensaje.id && item.adjuntos.length > 0,
  );
  assert.ok(mensajeConAdjunto);
  const adjuntoStatus = await verificarUrl(mensajeConAdjunto.adjuntos[0].url);
  assert.equal(adjuntoStatus, 200, `El adjunto no responde 200 (status ${adjuntoStatus}).`);
  console.log('PASS adjuntos de chat');

  console.log('SMOKE S4 OK');
}

main().catch((err: unknown) => {
  console.error('SMOKE S4 FAIL:', (err as Error).message);
  process.exit(1);
});
