import sharp from 'sharp';

export interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export interface DemoUser {
  token: string;
  usuario: { id: number; email: string; roles: string[] };
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const base = process.env.API_URL ?? 'http://localhost:3000/api';
  const res = await fetch(`${base}${path}`, { ...options, headers });
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
    const err = (data as ApiErrorBody | null)?.error;
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

export async function login(email: string, password: string): Promise<DemoUser> {
  return api<DemoUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fechaLocal(offsetDias = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDias);
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

export function rango(offsetDias: number, dias = 4): { inicio: string; fin: string } {
  return { inicio: fechaLocal(offsetDias), fin: fechaLocal(offsetDias + dias) };
}

export async function pngDemo(): Promise<{ buffer: Buffer; blob: Blob; nombre: string }> {
  const buffer = await sharp({
    create: {
      width: 12,
      height: 12,
      channels: 3,
      background: { r: 30, g: 150, b: 90 },
    },
  })
    .png()
    .toBuffer();
  return {
    buffer,
    blob: new Blob([new Uint8Array(buffer)], { type: 'image/png' }),
    nombre: 'demo-s4.png',
  };
}

export async function subirArchivos(
  path: string,
  field: string,
  files: { blob: Blob; nombre: string }[],
  token: string,
): Promise<unknown> {
  const form = new FormData();
  for (const file of files) form.append(field, file.blob, file.nombre);
  return api(path, { method: 'POST', body: form }, token);
}

export async function construirArriendoFinalizado(params: {
  clienteToken: string;
  proveedorToken: string;
  adminToken: string;
  observaciones: string;
  offsetDias: number;
}): Promise<{
  vehiculoId: number;
  proveedorId: number;
  reservaId: number;
  arriendoId: number;
  inspeccionDevolucionId: number;
}> {
  const vehiculos = await api<
    { ID_vehiculo: number; patente_vehiculo: string }[]
  >('/vehiculos/buscar');
  const vehiculo = vehiculos.find((v) => v.patente_vehiculo === 'DEMA01') ?? vehiculos[0];
  if (!vehiculo) throw new Error('No hay vehiculos. Ejecuta npm run seed.');

  const detalle = await api<{
    kilometraje: number;
    idProveedor: number;
    idSedeActual: number | null;
    sedes: { id: number; permiteEntrega: boolean; permiteDevolucion: boolean }[];
  }>(`/vehiculos/${vehiculo.ID_vehiculo}`);
  const idSede =
    detalle.sedes.find(
      (s) => s.id === detalle.idSedeActual && s.permiteEntrega && s.permiteDevolucion,
    )?.id ?? detalle.sedes.find((s) => s.permiteEntrega && s.permiteDevolucion)?.id;
  if (!idSede) throw new Error('El vehiculo demo no tiene sede habilitada.');

  const fechas = rango(params.offsetDias);
  const key = `${params.observaciones}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const reserva = await api<{
    id: number;
    idSedeRetiro: number;
    idSedeDevolucion: number;
    estado: string;
  }>(
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
        observaciones: params.observaciones,
      }),
    },
    params.clienteToken,
  );

  const pago = await api<{ token_ws: string }>(
    '/pagos/webpay/iniciar',
    { method: 'POST', body: JSON.stringify({ ID_reserva: reserva.id }) },
    params.clienteToken,
  );
  await api(
    '/pagos/webpay/confirmar',
    { method: 'POST', body: JSON.stringify({ token_ws: pago.token_ws, aprobada: true }) },
    params.clienteToken,
  );

  const arriendo = await api<{ id: number; kmInicial: number }>(
    '/arriendos/iniciar',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_reserva: reserva.id,
        ID_sede_retiro_real: reserva.idSedeRetiro,
        kilometraje_inicial: detalle.kilometraje,
        combustible_inicial: 100,
      }),
    },
    params.proveedorToken,
  );

  await api(
    `/arriendos/${arriendo.id}/contrato`,
    { method: 'POST', body: JSON.stringify({ aceptado: true }) },
    params.clienteToken,
  );
  await api(
    `/arriendos/${arriendo.id}/conductores`,
    { method: 'POST', body: JSON.stringify({ rut: '44.444.444-4' }) },
    params.clienteToken,
  );

  await api(
    `/arriendos/${arriendo.id}/devolucion`,
    {
      method: 'POST',
      body: JSON.stringify({
        ID_sede_devolucion_real: reserva.idSedeDevolucion,
        kilometraje_final: arriendo.kmInicial + 900,
        combustible_final: 80,
        limpieza: 'BUENA',
        observaciones: params.observaciones,
      }),
    },
    params.proveedorToken,
  );

  const detalleFinal = await api<{
    inspecciones: { id: number; tipo: string }[];
  }>(`/arriendos/${arriendo.id}`, {}, params.proveedorToken);
  const inspeccion = detalleFinal.inspecciones.find((i) => i.tipo === 'DEVOLUCION');
  if (!inspeccion) throw new Error('No se encontro inspeccion de devolucion.');

  await api(
    `/arriendos/${arriendo.id}/inspecciones/${inspeccion.id}/danos`,
    {
      method: 'POST',
      body: JSON.stringify({
        zona: 'PUERTA',
        tipo: 'RAYON',
        severidad: 'LEVE',
        descripcion: params.observaciones,
        monto_estimado: 15000,
      }),
    },
    params.proveedorToken,
  );
  await api(
    `/arriendos/${arriendo.id}/cargos-extra`,
    {
      method: 'POST',
      body: JSON.stringify({
        concepto: `Limpieza ${params.observaciones}`,
        monto: 12000,
        tipo_cargo: 'LIMPIEZA',
      }),
    },
    params.proveedorToken,
  );
  await api(
    `/arriendos/${arriendo.id}/multas`,
    {
      method: 'POST',
      body: JSON.stringify({
        fecha_multa: fechaLocal(0),
        descripcion: `Multa ${params.observaciones}`,
        monto: 5000,
        organismo: 'Municipalidad',
        numero_parte: `${params.observaciones}-${arriendo.id}`,
      }),
    },
    params.proveedorToken,
  );

  await api(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendo.id,
        tipo_resena: 'CLIENTE_A_VEHICULO',
        calificacion: 5,
        comentario: `Demo S4 vehiculo ${arriendo.id}`,
      }),
    },
    params.clienteToken,
  );
  await api(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendo.id,
        tipo_resena: 'CLIENTE_A_PROVEEDOR',
        calificacion: 5,
        comentario: `Demo S4 proveedor ${arriendo.id}`,
      }),
    },
    params.clienteToken,
  );
  await api(
    '/resenas',
    {
      method: 'POST',
      body: JSON.stringify({
        ID_arriendo: arriendo.id,
        tipo_resena: 'PROVEEDOR_A_CLIENTE',
        calificacion: 4,
        comentario: `Demo S4 cliente ${arriendo.id}`,
      }),
    },
    params.proveedorToken,
  );

  return {
    vehiculoId: vehiculo.ID_vehiculo,
    proveedorId: detalle.idProveedor,
    reservaId: reserva.id,
    arriendoId: arriendo.id,
    inspeccionDevolucionId: inspeccion.id,
  };
}
