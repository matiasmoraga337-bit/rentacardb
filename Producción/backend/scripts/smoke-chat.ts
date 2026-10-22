/**
 * Smoke de chat contra una API en ejecucion.
 * Uso: npm run smoke:chat   (requiere API + BD con `npm run seed`)
 */
import assert from 'node:assert/strict';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api';
const CLIENTE_EMAIL = process.env.SMOKE_EMAIL ?? 'demo@rentacar.cl';
const CLIENTE_PASSWORD = process.env.SMOKE_PASSWORD ?? 'Demo1234!';
const PROVEEDOR_EMAIL = process.env.SMOKE_PROVEEDOR_EMAIL ?? 'proveedor@rentacar.cl';
const PROVEEDOR_PASSWORD = process.env.SMOKE_PROVEEDOR_PASSWORD ?? 'Proveedor1234!';

interface ApiError {
  error?: { code?: string; message?: string };
}

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    const fallback = typeof data === 'string' ? data.slice(0, 200) : `HTTP ${res.status}`;
    const error = new Error(err?.message ?? fallback) as Error & {
      status?: number;
      code?: string;
    };
    error.status = res.status;
    error.code = err?.code;
    throw error;
  }
  return data as T;
}

interface Conversacion {
  id: number;
  proveedor: string;
  noLeidos: number;
  activa: boolean;
}

interface Mensaje {
  id: number;
  idEmisor: number;
  contenido: string;
}

async function main(): Promise<void> {
  console.log(`Smoke chat contra ${API_URL}`);

  const cliente = await api<{ token: string; usuario: { id: number } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CLIENTE_EMAIL, password: CLIENTE_PASSWORD }),
  });
  const proveedor = await api<{ token: string; usuario: { id: number } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: PROVEEDOR_EMAIL, password: PROVEEDOR_PASSWORD }),
  });
  console.log('PASS login cliente y proveedor');

  const buscar = await api<{ ID_vehiculo: number; patente_vehiculo: string }[]>(
    '/vehiculos/buscar',
  );
  const vehiculo = buscar.find((v) => v.patente_vehiculo === 'DEMA01') ?? buscar[0];
  assert.ok(vehiculo, 'No hay vehiculos. Ejecuta npm run seed.');
  const detalle = await api<{ idProveedor: number }>(`/vehiculos/${vehiculo.ID_vehiculo}`);

  const conversacion = await api<Conversacion>(
    '/conversaciones',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_proveedor: detalle.idProveedor,
        ID_vehiculo: vehiculo.ID_vehiculo,
      }),
    },
    cliente.token,
  );
  console.log(`PASS conversacion ${conversacion.id}`);

  const mensajeCliente = await api<Mensaje>(
    `/conversaciones/${conversacion.id}/mensajes`,
    { method: 'POST', body: JSON.stringify({ contenido: 'Hola, consulta por el vehiculo.' }) },
    cliente.token,
  );
  assert.equal(mensajeCliente.idEmisor, cliente.usuario.id);
  console.log('PASS mensaje del cliente');

  const conversacionesProveedor = await api<Conversacion[]>(
    '/conversaciones',
    {},
    proveedor.token,
  );
  const recibida = conversacionesProveedor.find((c) => c.id === conversacion.id);
  assert.ok(recibida, 'El proveedor no ve la conversacion.');
  assert.ok(recibida.noLeidos >= 1, 'El proveedor no tiene mensajes no leidos.');
  console.log('PASS bandeja del proveedor con no leidos');

  const mensajesProveedor = await api<Mensaje[]>(
    `/conversaciones/${conversacion.id}/mensajes`,
    {},
    proveedor.token,
  );
  assert.ok(mensajesProveedor.some((m) => m.contenido.includes('consulta')));
  await api(
    `/conversaciones/${conversacion.id}/leidos`,
    { method: 'POST' },
    proveedor.token,
  );
  console.log('PASS lectura de mensajes');

  const respuesta = await api<Mensaje>(
    `/conversaciones/${conversacion.id}/mensajes`,
    { method: 'POST', body: JSON.stringify({ contenido: 'Hola, en que te ayudo?' }) },
    proveedor.token,
  );
  assert.equal(respuesta.idEmisor, proveedor.usuario.id);
  console.log('PASS respuesta del proveedor');

  const mensajesCliente = await api<Mensaje[]>(
    `/conversaciones/${conversacion.id}/mensajes`,
    {},
    cliente.token,
  );
  assert.ok(mensajesCliente.some((m) => m.id === respuesta.id));
  await api(`/conversaciones/${conversacion.id}/leidos`, { method: 'POST' }, cliente.token);
  console.log('PASS mensajes visibles para el cliente');

  await api(`/conversaciones/${conversacion.id}/cerrar`, { method: 'POST' }, cliente.token);
  try {
    await api(
      `/conversaciones/${conversacion.id}/mensajes`,
      { method: 'POST', body: JSON.stringify({ contenido: 'Mensaje tras cierre' }) },
      cliente.token,
    );
    throw new Error('El mensaje tras cierre no fue rechazado.');
  } catch (err) {
    const e = err as Error & { status?: number };
    assert.ok(e.status === 404 || e.status === 409, `Estado inesperado: ${e.status}`);
    console.log('PASS cierre de conversacion');
  }

  console.log('SMOKE CHAT OK');
}

main().catch((err: unknown) => {
  console.error('SMOKE CHAT FAIL:', (err as Error).message);
  process.exit(1);
});
