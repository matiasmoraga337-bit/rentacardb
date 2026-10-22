/**
 * Seed demo S4 (idempotente) contra una API en ejecucion.
 * Uso: npm run seed:s4   (requiere API + BD y `npm run seed`)
 */
import {
  api,
  construirArriendoFinalizado,
  fechaLocal,
  login,
  pngDemo,
  subirArchivos,
} from './lib/demo-api';

const CLIENTE_EMAIL = process.env.SMOKE_EMAIL ?? 'demo@rentacar.cl';
const CLIENTE_PASSWORD = process.env.SMOKE_PASSWORD ?? 'Demo1234!';
const PROVEEDOR_EMAIL = process.env.SMOKE_PROVEEDOR_EMAIL ?? 'proveedor@rentacar.cl';
const PROVEEDOR_PASSWORD = process.env.SMOKE_PROVEEDOR_PASSWORD ?? 'Proveedor1234!';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@rentacar.cl';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin1234!';

interface ReservaDemo {
  id: number;
  vehiculoId: number;
  proveedorId: number;
  arriendoId: number | null;
  estadoArriendo: string | null;
  observaciones: string | null;
}

interface ArriendoDemo {
  id: number;
  vehiculoId: number;
  proveedorId: number;
  inspecciones: { id: number; tipo: string; fotos: { id: number }[] }[];
}

interface DisputaDemo {
  id: number;
  arriendoId: number;
  estado: string;
}

interface LiquidacionDemo {
  id: number;
  proveedorId: number;
  periodoInicio: string;
  periodoFin: string;
  estado: string;
}

interface ConversacionDemo {
  id: number;
  idProveedor: number;
  idVehiculo: number | null;
  activa: boolean;
}

interface MensajeDemo {
  id: number;
  contenido: string;
  adjuntos: { id: number }[];
}

async function main(): Promise<void> {
  console.log('Seed S4 contra la API...');
  const cliente = await login(CLIENTE_EMAIL, CLIENTE_PASSWORD);
  const proveedor = await login(PROVEEDOR_EMAIL, PROVEEDOR_PASSWORD);
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('PASS login cliente, proveedor y admin');

  const reservas = await api<{ data: ReservaDemo[] }>(
    '/reservas?scope=cliente&page=1&pageSize=100',
    {},
    cliente.token,
  );
  let reserva = reservas.data.find(
    (item) => item.observaciones === 'DEMO-S4' && item.estadoArriendo === 'FINALIZADO',
  );

  if (!reserva || !reserva.arriendoId) {
    console.log('No hay arriendo DEMO-S4; creando escenario completo...');
    const creado = await construirArriendoFinalizado({
      clienteToken: cliente.token,
      proveedorToken: proveedor.token,
      adminToken: admin.token,
      observaciones: 'DEMO-S4',
      offsetDias: 700,
    });
    console.log(`OK   arriendo ${creado.arriendoId} FINALIZADO (reserva ${creado.reservaId})`);
    reserva = {
      id: creado.reservaId,
      vehiculoId: creado.vehiculoId,
      proveedorId: creado.proveedorId,
      arriendoId: creado.arriendoId,
      estadoArriendo: 'FINALIZADO',
      observaciones: 'DEMO-S4',
    };
  } else {
    console.log(`SKIP arriendo DEMO-S4 (ID ${reserva.arriendoId}).`);
  }

  const arriendo = await api<ArriendoDemo>(
    `/arriendos/${reserva.arriendoId}`,
    {},
    proveedor.token,
  );

  const disputas = await api<{ data: DisputaDemo[] }>(
    `/disputas?arriendo=${arriendo.id}&pageSize=50`,
    {},
    cliente.token,
  );
  let disputa = disputas.data.find(
    (item) => item.estado === 'ABIERTA' || item.estado === 'EN_REVISION',
  );
  if (!disputa) {
    disputa = await api<DisputaDemo>(
      '/disputas',
      {
        method: 'POST',
        body: JSON.stringify({
          ID_arriendo: arriendo.id,
          tipo_disputa: 'DANO',
          descripcion: 'Disputa demo S4: cargo por dano no reconocido.',
          monto_disputado: 15000,
        }),
      },
      cliente.token,
    );
    console.log(`OK   disputa ${disputa.id} ABIERTA`);
  } else {
    console.log(`SKIP disputa ${disputa.id} (${disputa.estado}).`);
  }

  const liquidaciones = await api<{ data: LiquidacionDemo[] }>(
    `/liquidaciones?proveedor=${arriendo.proveedorId}&pageSize=50`,
    {},
    admin.token,
  );
  let liquidacion = liquidaciones.data.find(
    (item) => item.periodoInicio <= fechaLocal(0) && item.periodoFin >= fechaLocal(0),
  );
  if (!liquidacion) {
    liquidacion = await api<LiquidacionDemo>(
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
    console.log(`OK   liquidacion ${liquidacion.id} ${liquidacion.estado}`);
  } else {
    console.log(`SKIP liquidacion ${liquidacion.id} (${liquidacion.estado}).`);
  }

  const favoritos = await api<{ vehiculoId: number }[]>('/favoritos', {}, cliente.token);
  if (!favoritos.some((item) => item.vehiculoId === arriendo.vehiculoId)) {
    await api(
      `/favoritos/${arriendo.vehiculoId}`,
      { method: 'POST' },
      cliente.token,
    );
    console.log(`OK   favorito vehiculo ${arriendo.vehiculoId}`);
  } else {
    console.log('SKIP favorito demo.');
  }

  const busquedas = await api<{ id: number; nombre: string | null }[]>(
    '/busquedas',
    {},
    cliente.token,
  );
  if (!busquedas.some((item) => item.nombre === 'Demo S4')) {
    await api(
      '/busquedas',
      {
        method: 'POST',
        body: JSON.stringify({ nombre: 'Demo S4', precio_maximo: 50000 }),
      },
      cliente.token,
    );
    console.log('OK   busqueda guardada Demo S4');
  } else {
    console.log('SKIP busqueda guardada Demo S4.');
  }

  const conversaciones = await api<ConversacionDemo[]>('/conversaciones', {}, cliente.token);
  let conversacion = conversaciones.find(
    (item) =>
      item.activa &&
      item.idProveedor === arriendo.proveedorId &&
      item.idVehiculo === arriendo.vehiculoId,
  );
  if (!conversacion) {
    conversacion = await api<ConversacionDemo>(
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
    console.log(`OK   conversacion ${conversacion.id}`);
  } else {
    console.log(`SKIP conversacion ${conversacion.id}.`);
  }

  const mensajes = await api<MensajeDemo[]>(
    `/conversaciones/${conversacion.id}/mensajes`,
    {},
    cliente.token,
  );
  let mensaje = mensajes.find((item) => item.contenido === 'Mensaje demo S4 con adjunto');
  if (!mensaje) {
    mensaje = await api<MensajeDemo>(
      `/conversaciones/${conversacion.id}/mensajes`,
      {
        method: 'POST',
        body: JSON.stringify({ contenido: 'Mensaje demo S4 con adjunto' }),
      },
      cliente.token,
    );
    console.log(`OK   mensaje ${mensaje.id}`);
  }
  if (!mensaje.adjuntos || mensaje.adjuntos.length === 0) {
    const png = await pngDemo();
    await subirArchivos(
      `/conversaciones/${conversacion.id}/mensajes/${mensaje.id}/adjuntos`,
      'archivos',
      [png],
      cliente.token,
    );
    console.log('OK   adjunto de chat');
  } else {
    console.log('SKIP adjunto de chat.');
  }

  const inspeccion = arriendo.inspecciones.find((item) => item.tipo === 'DEVOLUCION');
  if (inspeccion && inspeccion.fotos.length === 0) {
    const png = await pngDemo();
    await subirArchivos(
      `/arriendos/${arriendo.id}/inspecciones/${inspeccion.id}/fotos`,
      'fotos',
      [png],
      proveedor.token,
    );
    console.log('OK   foto de inspeccion');
  } else {
    console.log('SKIP foto de inspeccion.');
  }

  console.log('');
  console.log('Demo S4 lista:');
  console.log(`  arriendo:    ${arriendo.id}`);
  console.log(`  disputa:     ${disputa.id} (${disputa.estado})`);
  console.log(`  liquidacion: ${liquidacion.id} (${liquidacion.estado})`);
  console.log(`  conversacion:${conversacion.id}`);
  console.log(`  vehiculo:    ${arriendo.vehiculoId}`);
  console.log('  Cliente: demo@rentacar.cl / Demo1234!');
  console.log('  Admin:   admin@rentacar.cl / Admin1234!');
  console.log('  Proveedor: proveedor@rentacar.cl / Proveedor1234!');
}

main().catch((err: unknown) => {
  console.error('SEED S4 FAIL:', (err as Error).message);
  process.exit(1);
});
