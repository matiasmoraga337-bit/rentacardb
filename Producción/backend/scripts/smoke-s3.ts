/**
 * Smoke S3 (E9 + E10.1/E10.2 + E13) contra una API en ejecucion.
 * Uso: npm run smoke:s3   (requiere API + BD con `npm run seed`)
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

function formatear(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function rango(offsetDias: number): { inicio: string; fin: string } {
  const inicioDate = new Date();
  inicioDate.setDate(inicioDate.getDate() + offsetDias);
  const finDate = new Date(inicioDate);
  finDate.setDate(finDate.getDate() + 4);
  return { inicio: formatear(inicioDate), fin: formatear(finDate) };
}

interface Reserva {
  id: number;
  total: number;
  idSedeRetiro: number;
  idSedeDevolucion: number;
  estado: string;
  vehiculoId: number;
}

interface Arriendo {
  id: number;
  estado: string;
  kmInicial: number;
  inspecciones: { id: number; tipo: string }[];
  cargos: { tipo: string | null; monto: number }[];
  danos: { id: number; zona: string }[];
  multas: { id: number; descripcion: string; monto: number }[];
}

async function main(): Promise<void> {
  console.log(`Smoke S3/E9+E10+E13 contra ${API_URL}`);

  const clienteLogin = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CLIENTE_EMAIL, password: CLIENTE_PASSWORD }),
  });
  const proveedorLogin = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: PROVEEDOR_EMAIL, password: PROVEEDOR_PASSWORD }),
  });
  console.log('PASS login cliente y proveedor');

  const fechas = rango(500 + Math.floor(Math.random() * 100));
  const buscar = await api<{ ID_vehiculo: number; patente_vehiculo: string }[]>(
    `/vehiculos/buscar?fecha_inicio=${fechas.inicio}&fecha_fin=${fechas.fin}`,
  );
  const vehiculo = buscar.find((v) => v.patente_vehiculo === 'DEMA01') ?? buscar[0];
  assert.ok(vehiculo, 'No hay vehiculos disponibles. Ejecuta npm run seed.');
  const detalleVehiculo = await api<{
    kilometraje: number;
    idProveedor: number;
    idSedeActual: number | null;
    sedes: { id: number; permiteEntrega: boolean; permiteDevolucion: boolean }[];
  }>(`/vehiculos/${vehiculo.ID_vehiculo}`);
  const idSede =
    detalleVehiculo.sedes.find(
      (s) =>
        s.id === detalleVehiculo.idSedeActual && s.permiteEntrega && s.permiteDevolucion,
    )?.id ??
    detalleVehiculo.sedes.find((s) => s.permiteEntrega && s.permiteDevolucion)?.id;
  assert.ok(idSede, 'El vehiculo demo no tiene una sede habilitada para retiro y devolucion.');
  const resenasVehiculoAntes = await api<{ total: number }>(
    `/vehiculos/${vehiculo.ID_vehiculo}/resenas`,
  );
  const resenasProveedorAntes = await api<{ total: number }>(
    `/proveedores/${detalleVehiculo.idProveedor}/resenas`,
  );
  console.log('PASS busqueda y vehiculo');

  const key = `smoke-s3-${crypto.randomUUID()}`;
  const reserva = await api<Reserva>(
    '/reservas',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({
        ID_vehiculo: vehiculo.ID_vehiculo,
        ID_sede_retiro: idSede,
        ID_sede_devolucion: idSede,
        fecha_inicio: fechas.inicio,
        fecha_fin: fechas.fin,
        politica_combustible: 'MISMO_NIVEL',
      }),
    },
    clienteLogin.token,
  );
  assert.equal(reserva.estado, 'PENDIENTE');
  console.log(`PASS reserva ${reserva.id} con politica de km`);

  const pago = await api<{ token_ws: string; monto: number }>(
    '/pagos/webpay/iniciar',
    { method: 'POST', body: JSON.stringify({ ID_reserva: reserva.id }) },
    clienteLogin.token,
  );
  await api(
    '/pagos/webpay/confirmar',
    { method: 'POST', body: JSON.stringify({ token_ws: pago.token_ws, aprobada: true }) },
    clienteLogin.token,
  );
  console.log('PASS pago WebPay');

  const arriendoIniciado = await api<Arriendo>(
    '/arriendos/iniciar',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_reserva: reserva.id,
        ID_sede_retiro_real: reserva.idSedeRetiro,
        kilometraje_inicial: detalleVehiculo.kilometraje,
        combustible_inicial: 100,
      }),
    },
    proveedorLogin.token,
  );
  assert.equal(arriendoIniciado.estado, 'ACTIVO');
  const detalleInicio = await api<Arriendo>(`/arriendos/${arriendoIniciado.id}`, {}, proveedorLogin.token);
  assert.ok(detalleInicio.inspecciones.some((i) => i.tipo === 'ENTREGA'));
  console.log(`PASS arriendo ${arriendoIniciado.id} ACTIVO`);

  const contrato = await api<{ hash: string }>(
    `/arriendos/${arriendoIniciado.id}/contrato`,
    { method: 'POST', body: JSON.stringify({ aceptado: true }) },
    clienteLogin.token,
  );
  assert.equal(contrato.hash.length, 64);
  console.log('PASS contrato aceptado');

  await api(
    `/arriendos/${arriendoIniciado.id}/conductores`,
    { method: 'POST', body: JSON.stringify({ rut: '44.444.444-4' }) },
    clienteLogin.token,
  );
  console.log('PASS conductor adicional');

  const arriendoDevuelto = await api<Arriendo>(
    `/arriendos/${arriendoIniciado.id}/devolucion`,
    {
      method: 'POST',
      body: JSON.stringify({
        ID_sede_devolucion_real: reserva.idSedeDevolucion,
        kilometraje_final: arriendoIniciado.kmInicial + 900,
        combustible_final: 80,
        limpieza: 'BUENA',
        observaciones: 'Smoke S3',
      }),
    },
    proveedorLogin.token,
  );
  assert.equal(arriendoDevuelto.estado, 'FINALIZADO');
  const detalleDevolucion = await api<Arriendo>(`/arriendos/${arriendoDevuelto.id}`, {}, proveedorLogin.token);
  assert.ok(detalleDevolucion.inspecciones.some((i) => i.tipo === 'DEVOLUCION'));
  const cargoKm = detalleDevolucion.cargos.find((c) => c.tipo === 'KM_EXCEDIDO');
  assert.ok(cargoKm, 'No se creo el cargo por km excedido.');
  assert.equal(cargoKm.monto, 10000);
  const contratoFinal = await api<{ hash: string }>(
    `/arriendos/${arriendoDevuelto.id}/contrato`,
    {},
    clienteLogin.token,
  );
  assert.equal(contratoFinal.hash, contrato.hash, 'El hash del contrato cambio tras la devolucion.');
  console.log('PASS devolucion y cargo por km');

  const inspeccionDevolucion = detalleDevolucion.inspecciones.find(
    (i) => i.tipo === 'DEVOLUCION',
  );
  assert.ok(inspeccionDevolucion);
  await api(
    `/arriendos/${arriendoDevuelto.id}/inspecciones/${inspeccionDevolucion.id}/danos`,
    {
      method: 'POST',
      body: JSON.stringify({
        zona: 'PUERTA',
        tipo: 'RAYON',
        severidad: 'LEVE',
        descripcion: 'Smoke S3',
        monto_estimado: 15000,
      }),
    },
    proveedorLogin.token,
  );
  const detalleFinal = await api<Arriendo>(
    `/arriendos/${arriendoDevuelto.id}`,
    {},
    clienteLogin.token,
  );
  assert.ok(detalleFinal.danos.length > 0);
  console.log('PASS dano de devolucion');

  await api(
    `/arriendos/${arriendoDevuelto.id}/cargos-extra`,
    {
      method: 'POST',
      body: JSON.stringify({
        concepto: 'Limpieza especial (smoke)',
        monto: 12000,
        tipo_cargo: 'LIMPIEZA',
        observaciones: 'Smoke S3',
      }),
    },
    proveedorLogin.token,
  );
  await api(
    `/arriendos/${arriendoDevuelto.id}/multas`,
    {
      method: 'POST',
      body: JSON.stringify({
        fecha_multa: new Date().toISOString().slice(0, 10),
        descripcion: 'Parte de prueba (smoke)',
        monto: 5000,
        organismo: 'Municipalidad',
        numero_parte: `SMOKE-${arriendoDevuelto.id}`,
      }),
    },
    proveedorLogin.token,
  );
  const detalleConCargos = await api<Arriendo>(
    `/arriendos/${arriendoDevuelto.id}`,
    {},
    proveedorLogin.token,
  );
  assert.ok(
    detalleConCargos.cargos.some((cargo) => cargo.tipo === 'LIMPIEZA' && cargo.monto === 12000),
    'No se creo el cargo extra.',
  );
  assert.ok(
    detalleConCargos.multas.some((multa) => multa.monto === 5000),
    'No se creo la multa.',
  );
  console.log('PASS cargo extra y multa');

  const resenaVehiculo = await api<{ id: number; tipo: string; calificacion: number }>(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendoDevuelto.id,
        tipo_resena: 'CLIENTE_A_VEHICULO',
        calificacion: 5,
        comentario: 'Excelente vehiculo (smoke)',
      }),
    },
    clienteLogin.token,
  );
  assert.equal(resenaVehiculo.tipo, 'CLIENTE_A_VEHICULO');

  await api(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendoDevuelto.id,
        tipo_resena: 'CLIENTE_A_PROVEEDOR',
        calificacion: 5,
        comentario: 'Excelente proveedor (smoke)',
      }),
    },
    clienteLogin.token,
  );

  const resenaCliente = await api<{ tipo: string }>(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendoDevuelto.id,
        tipo_resena: 'PROVEEDOR_A_CLIENTE',
        calificacion: 4,
        comentario: 'Cliente puntual (smoke)',
      }),
    },
    proveedorLogin.token,
  );
  assert.equal(resenaCliente.tipo, 'PROVEEDOR_A_CLIENTE');

  const resenasVehiculo = await api<{
    total: number;
    promedio: number | null;
    resenas: { calificacion: number; autor: string }[];
  }>(`/vehiculos/${vehiculo.ID_vehiculo}/resenas`);
  assert.equal(resenasVehiculo.total, resenasVehiculoAntes.total + 1);
  assert.equal(resenasVehiculo.resenas[0]?.calificacion, 5);

  const resenasProveedor = await api<{ total: number; promedio: number | null }>(
    `/proveedores/${detalleVehiculo.idProveedor}/resenas`,
  );
  assert.equal(resenasProveedor.total, resenasProveedorAntes.total + 1);
  console.log('PASS resenas cliente/proveedor y listado publico');

  console.log('SMOKE S3/E9+E10+E13 OK');
}

main().catch((err: unknown) => {
  console.error('SMOKE S3/E9+E10+E13 FAIL:', (err as Error).message);
  process.exit(1);
});
