/**
 * Smoke test S2 contra una API en ejecucion.
 * Uso: npm run smoke:s2   (requiere API + BD con `npm run seed`)
 */
import assert from 'node:assert/strict';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api';
const DEMO_EMAIL = process.env.SMOKE_EMAIL ?? 'demo@rentacar.cl';
const DEMO_PASSWORD = process.env.SMOKE_PASSWORD ?? 'Demo1234!';

interface ApiError {
  error?: { code?: string; message?: string };
}

async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
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

async function main(): Promise<void> {
  console.log(`Smoke S2 contra ${API_URL}`);

  const login = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  console.log('PASS login demo');

  const inicioDate = new Date();
  inicioDate.setDate(inicioDate.getDate() + 60 + Math.floor(Math.random() * 200));
  const finDate = new Date(inicioDate);
  finDate.setDate(finDate.getDate() + 4);
  const inicio = formatear(inicioDate);
  const fin = formatear(finDate);

  const buscar = await api<
    { ID_vehiculo: number; patente_vehiculo: string }[]
  >(`/vehiculos/buscar?fecha_inicio=${inicio}&fecha_fin=${fin}`);
  const vehiculo = buscar.find((v) => v.patente_vehiculo === 'DEMA01') ?? buscar[0];
  assert.ok(vehiculo, 'No hay vehiculos disponibles. Ejecuta npm run seed.');
  console.log(`PASS busqueda (${vehiculo.patente_vehiculo})`);

  const detalle = await api<{ sedes: { id: number; permiteEntrega: boolean; permiteDevolucion: boolean }[] }>(
    `/vehiculos/${vehiculo.ID_vehiculo}`,
  );
  const retiro = detalle.sedes.find((s) => s.permiteEntrega)?.id;
  const devolucion = detalle.sedes.find((s) => s.permiteDevolucion)?.id;
  assert.ok(retiro && devolucion, 'El vehiculo demo no tiene sedes configuradas.');
  console.log('PASS sedes del vehiculo');

  const disponibilidad = await api<{ disponible: boolean; total: number }>(
    `/vehiculos/${vehiculo.ID_vehiculo}/disponibilidad?desde=${inicio}&hasta=${fin}`,
  );
  assert.equal(disponibilidad.disponible, true, 'El vehiculo demo no esta disponible.');
  console.log(`PASS disponibilidad (total ${disponibilidad.total})`);

  const key = `smoke-${crypto.randomUUID()}`;
  const body = JSON.stringify({
    ID_vehiculo: vehiculo.ID_vehiculo,
    ID_sede_retiro: retiro,
    ID_sede_devolucion: devolucion,
    fecha_inicio: inicio,
    fecha_fin: fin,
    politica_combustible: 'MISMO_NIVEL',
  });
  const reserva = await api<{ id: number; estado: string; total: number }>(
    '/reservas',
    { method: 'POST', headers: { 'Idempotency-Key': key }, body },
    login.token,
  );
  assert.equal(reserva.estado, 'PENDIENTE');
  console.log(`PASS reserva ${reserva.id} PENDIENTE`);

  const repetida = await api<{ id: number }>(
    '/reservas',
    { method: 'POST', headers: { 'Idempotency-Key': key }, body },
    login.token,
  );
  assert.equal(repetida.id, reserva.id, 'La idempotencia devolvio otra reserva.');
  console.log('PASS idempotencia');

  try {
    await api(
      '/reservas',
      { method: 'POST', headers: { 'Idempotency-Key': `smoke-over-${crypto.randomUUID()}` }, body },
      login.token,
    );
    throw new Error('El solapamiento no fue rechazado.');
  } catch (err) {
    const e = err as Error & { status?: number; code?: string };
    assert.equal(e.status, 409, `Se esperaba 409 y se obtuvo ${e.status}`);
    assert.equal(e.code, 'RESERVA_SOLAPADA');
    console.log('PASS solapamiento rechazado (409)');
  }

  const pago = await api<{ token_ws: string; monto: number }>(
    '/pagos/webpay/iniciar',
    { method: 'POST', body: JSON.stringify({ ID_reserva: reserva.id }) },
    login.token,
  );
  assert.equal(pago.monto, reserva.total);
  console.log('PASS WebPay iniciar');

  await api(
    '/pagos/webpay/confirmar',
    { method: 'POST', body: JSON.stringify({ token_ws: pago.token_ws, aprobada: true }) },
    login.token,
  );
  const confirmada = await api<{ estado: string; estadoPago: string }>(
    `/reservas/${reserva.id}`,
    {},
    login.token,
  );
  assert.equal(confirmada.estado, 'CONFIRMADA');
  assert.equal(confirmada.estadoPago, 'APROBADO');
  console.log('PASS WebPay confirmar (CONFIRMADA)');

  const preview = await api<{ montoReembolso: number }>(
    `/reservas/${reserva.id}/cancelacion`,
    {},
    login.token,
  );
  assert.ok(preview.montoReembolso > 0, 'El reembolso esperado es cero.');
  console.log(`PASS preview reembolso (${preview.montoReembolso})`);

  const cancelKey = `smoke-cancel-${crypto.randomUUID()}`;
  const cancelada = await api<{ reserva: { estado: string }; reembolso: { estado: string } | null }>(
    `/reservas/${reserva.id}/cancelar`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': cancelKey },
      body: JSON.stringify({
        motivo: 'Smoke S2',
        solicitar_reembolso: true,
        motivo_reembolso: 'Smoke S2 refund',
      }),
    },
    login.token,
  );
  assert.equal(cancelada.reserva.estado, 'CANCELADA');
  assert.equal(cancelada.reembolso?.estado, 'COMPLETADO');
  console.log('PASS cancelacion con reembolso');

  const raceRange = rango(300 + Math.floor(Math.random() * 100));
  const raceKey = `smoke-race-${crypto.randomUUID()}`;
  const raceBody = JSON.stringify({
    ID_vehiculo: vehiculo.ID_vehiculo,
    ID_sede_retiro: retiro,
    ID_sede_devolucion: devolucion,
    fecha_inicio: raceRange.inicio,
    fecha_fin: raceRange.fin,
    politica_combustible: 'MISMO_NIVEL',
  });
  const raceReserva = await api<{ id: number; total: number }>(
    '/reservas',
    { method: 'POST', headers: { 'Idempotency-Key': raceKey }, body: raceBody },
    login.token,
  );
  const racePago = await api<{ token_ws: string }>(
    '/pagos/webpay/iniciar',
    { method: 'POST', body: JSON.stringify({ ID_reserva: raceReserva.id }) },
    login.token,
  );
  const confirmar = (): Promise<unknown> =>
    api(
      '/pagos/webpay/confirmar',
      { method: 'POST', body: JSON.stringify({ token_ws: racePago.token_ws, aprobada: true }) },
      login.token,
    );
  const resultados = await Promise.allSettled([confirmar(), confirmar()]);
  const exitos = resultados.filter((r) => r.status === 'fulfilled').length;
  const fallos = resultados.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  assert.equal(exitos, 1, `Se esperaba una confirmacion exitosa y hubo ${exitos}.`);
  assert.equal(fallos.length, 1);
  assert.equal((fallos[0].reason as { status?: number }).status, 409);
  const pagosRace = await api<{ estado: string }[]>(
    `/pagos?reserva=${raceReserva.id}`,
    {},
    login.token,
  );
  assert.equal(
    pagosRace.filter((p) => p.estado === 'APROBADO').length,
    1,
    'La carrera genero mas de un pago aprobado.',
  );
  console.log('PASS WebPay concurrencia (1 pago aprobado)');

  const cancelRaceKey = `smoke-race-cancel-${crypto.randomUUID()}`;
  await api(
    `/reservas/${raceReserva.id}/cancelar`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': cancelRaceKey },
      body: JSON.stringify({
        motivo: 'Smoke S2 race',
        solicitar_reembolso: true,
        motivo_reembolso: 'Smoke S2 race refund',
      }),
    },
    login.token,
  );

  const cancelRange = rango(450 + Math.floor(Math.random() * 100));
  const cancelKeyPend = `smoke-cancel-pend-${crypto.randomUUID()}`;
  const cancelBody = JSON.stringify({
    ID_vehiculo: vehiculo.ID_vehiculo,
    ID_sede_retiro: retiro,
    ID_sede_devolucion: devolucion,
    fecha_inicio: cancelRange.inicio,
    fecha_fin: cancelRange.fin,
    politica_combustible: 'MISMO_NIVEL',
  });
  const pendiente = await api<{ id: number }>(
    '/reservas',
    { method: 'POST', headers: { 'Idempotency-Key': cancelKeyPend }, body: cancelBody },
    login.token,
  );
  const pagoPendiente = await api<{ token_ws: string }>(
    '/pagos/webpay/iniciar',
    { method: 'POST', body: JSON.stringify({ ID_reserva: pendiente.id }) },
    login.token,
  );
  await api(
    `/reservas/${pendiente.id}/cancelar`,
    {
      method: 'POST',
      body: JSON.stringify({ motivo: 'Smoke S2 cancel pending', solicitar_reembolso: false }),
    },
    login.token,
  );
  try {
    await api(
      '/pagos/webpay/confirmar',
      {
        method: 'POST',
        body: JSON.stringify({ token_ws: pagoPendiente.token_ws, aprobada: true }),
      },
      login.token,
    );
    throw new Error('La confirmacion tras cancelar no fue rechazada.');
  } catch (err) {
    const e = err as Error & { status?: number; code?: string };
    assert.equal(e.status, 409);
    assert.ok(
      e.code === 'RESERVA_NO_PENDIENTE' || e.code === 'TRANSACCION_YA_RESUELTA',
      `Codigo inesperado: ${e.code}`,
    );
    console.log('PASS WebPay rechaza confirmacion tras cancelar');
  }

  console.log('SMOKE S2 OK');
}

main().catch((err: unknown) => {
  console.error('SMOKE S2 FAIL:', (err as Error).message);
  process.exit(1);
});
