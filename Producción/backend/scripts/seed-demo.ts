/**
 * Seed de datos demo de RentaCarDB (S0-S3).
 * Uso: npm run seed   (requiere la BD levantada y el .env configurado)
 *
 * Usuarios:
 *   admin@rentacar.cl      / Admin1234!      (ADMIN)
 *   demo@rentacar.cl       / Demo1234!       (CLIENTE)
 *   proveedor@rentacar.cl  / Proveedor1234!  (PROVEEDOR)
 *
 * Ademas crea un proveedor aprobado, dos sedes, dos vehiculos publicados,
 * documentos verificados y las filas VehiculoSede necesarias para reservar.
 */
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { closePool, getPool } from '../src/config/db';
import * as authRepo from '../src/repositories/auth.repository';
import * as proveedorRepo from '../src/repositories/proveedor.repository';
import * as vehiculoRepo from '../src/repositories/vehiculo.repository';

interface DemoUser {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  email: string;
  password: string;
  rol: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    rut: '11111111-1',
    nombres: 'Admin',
    apellidoPaterno: 'Demo',
    email: 'admin@rentacar.cl',
    password: 'Admin1234!',
    rol: 'ADMIN',
  },
  {
    rut: '22222222-2',
    nombres: 'Cliente',
    apellidoPaterno: 'Demo',
    email: 'demo@rentacar.cl',
    password: 'Demo1234!',
    rol: 'CLIENTE',
  },
  {
    rut: '33333333-3',
    nombres: 'Proveedor',
    apellidoPaterno: 'Demo',
    email: 'proveedor@rentacar.cl',
    password: 'Proveedor1234!',
    rol: 'PROVEEDOR',
  },
];

const VEHICULOS_DEMO = [
  {
    patente: 'DEMA01',
    vin: 'DEMOVIN0000000001',
    ID_modelo: 1,
    ID_tipo_vehiculo: 1,
    ID_tipo_combustible: 1,
    ID_tipo_transmision: 2,
    anio: 2023,
    kilometraje: 28000,
    precio: 24990,
  },
  {
    patente: 'DEMB02',
    vin: 'DEMOVIN0000000002',
    ID_modelo: 2,
    ID_tipo_vehiculo: 2,
    ID_tipo_combustible: 1,
    ID_tipo_transmision: 2,
    anio: 2024,
    kilometraje: 15000,
    precio: 34990,
  },
];

function fechaLocal(offsetDias = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDias);
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function fechaLocalAnios(anios: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + anios);
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

async function findUserId(email: string): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.VarChar(150), email)
    .query<{ ID_usuario: number }>('SELECT ID_usuario FROM dbo.Usuario WHERE email_usuario = @email');
  return result.recordset[0]?.ID_usuario ?? null;
}

async function findComuna(nombre: string): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('nombre', sql.NVarChar(100), nombre)
    .query<{ ID_comuna: number }>(
      `SELECT TOP 1 ID_comuna FROM dbo.Comuna
       WHERE nombre_comuna = @nombre AND activo_comuna = 1
       ORDER BY ID_comuna`,
    );
  if (result.recordset[0]?.ID_comuna) return result.recordset[0].ID_comuna;

  const fallback = await pool
    .request()
    .query<{ ID_comuna: number }>(
      'SELECT TOP 1 ID_comuna FROM dbo.Comuna WHERE activo_comuna = 1 ORDER BY ID_comuna',
    );
  if (!fallback.recordset[0]?.ID_comuna) {
    throw new Error('No hay comunas activas para crear las sedes demo.');
  }
  return fallback.recordset[0].ID_comuna;
}

async function findVehiculoPorPatente(patente: string): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('patente', sql.VarChar(10), patente)
    .query<{ ID_vehiculo: number }>(
      'SELECT ID_vehiculo FROM dbo.Vehiculo WHERE patente_vehiculo = @patente',
    );
  return result.recordset[0]?.ID_vehiculo ?? null;
}

async function ensureUsuario(user: DemoUser): Promise<number> {
  const existente = await findUserId(user.email);
  if (existente) {
    console.log(`SKIP usuario ${user.email} (ID ${existente}).`);
    return existente;
  }

  const passwordHash = await bcrypt.hash(user.password, 10);
  const row = await authRepo.registrarUsuario({
    rut: user.rut,
    nombres: user.nombres,
    apellidoPaterno: user.apellidoPaterno,
    email: user.email,
    passwordHash,
    rol: user.rol,
  });
  if (!row) throw new Error(`No se pudo crear el usuario ${user.email}.`);
  console.log(`OK   usuario ${user.email} (ID ${row.ID_usuario}, rol ${user.rol}).`);
  return row.ID_usuario;
}

async function findClaseLicencia(codigo: string): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('codigo', sql.VarChar(10), codigo)
    .query<{ ID_clase_licencia: number }>(
      `SELECT TOP 1 ID_clase_licencia FROM dbo.ClaseLicencia
       WHERE codigo_clase_licencia = @codigo AND activo_clase_licencia = 1`,
    );
  if (!result.recordset[0]?.ID_clase_licencia) {
    throw new Error(`No existe la clase de licencia ${codigo}.`);
  }
  return result.recordset[0].ID_clase_licencia;
}

async function ensurePersonaExtra(
  rut: string,
  nombres: string,
  apellidoPaterno: string,
): Promise<number> {
  const pool = await getPool();
  const existente = await pool
    .request()
    .input('rut', sql.VarChar(12), rut)
    .query<{ ID_persona: number }>(
      'SELECT TOP 1 ID_persona FROM dbo.Persona WHERE rut_persona = @rut',
    );
  if (existente.recordset[0]?.ID_persona) {
    console.log(`SKIP persona adicional ${rut} (ID ${existente.recordset[0].ID_persona}).`);
    return existente.recordset[0].ID_persona;
  }

  const result = await pool
    .request()
    .input('rut', sql.VarChar(12), rut)
    .input('nombres', sql.NVarChar(80), nombres)
    .input('apellido_paterno', sql.NVarChar(50), apellidoPaterno)
    .input('fecha_nacimiento', sql.Date, '1990-01-01')
    .query<{ ID_persona: number }>(
      `INSERT INTO dbo.Persona
         (rut_persona, nombres_persona, apellido_paterno_persona, fecha_nacimiento_persona)
       OUTPUT inserted.ID_persona
       VALUES (@rut, @nombres, @apellido_paterno, @fecha_nacimiento)`,
    );
  const idPersona = result.recordset[0]?.ID_persona;
  if (!idPersona) throw new Error(`No se pudo crear la persona ${rut}.`);
  console.log(`OK   persona adicional ${rut} (ID ${idPersona}).`);
  return idPersona;
}

async function ensureLicencia(idPersona: number, numeroLicencia: string): Promise<void> {
  const pool = await getPool();
  const vencimiento = fechaLocalAnios(2);
  const existente = await pool
    .request()
    .input('idPersona', sql.Int, idPersona)
    .query<{ ID_licencia_conducir: number }>(
      `SELECT TOP 1 ID_licencia_conducir
       FROM dbo.LicenciaConducir
       WHERE ID_persona_licencia_conducir = @idPersona AND activa_licencia = 1
       ORDER BY ID_licencia_conducir DESC`,
    );

  const idExistente = existente.recordset[0]?.ID_licencia_conducir;
  if (idExistente) {
    await pool
      .request()
      .input('id', sql.Int, idExistente)
      .input('vencimiento', sql.Date, vencimiento)
      .query(
        `UPDATE dbo.LicenciaConducir
         SET verificada_licencia = 1, activa_licencia = 1,
             fecha_vencimiento_licencia = @vencimiento
         WHERE ID_licencia_conducir = @id`,
      );
    console.log(`SKIP licencia persona ${idPersona} (ID ${idExistente}, verificada).`);
    return;
  }

  const idClase = await findClaseLicencia('B');
  const result = await pool
    .request()
    .input('ID_persona', sql.Int, idPersona)
    .input('ID_clase_licencia', sql.Int, idClase)
    .input('numero_licencia', sql.VarChar(20), numeroLicencia)
    .input('fecha_emision', sql.Date, fechaLocal(-365))
    .input('fecha_vencimiento', sql.Date, vencimiento)
    .input('url_archivo', sql.VarChar(500), null)
    .execute('u_sp_RegistrarLicenciaConducir');
  const idLicencia = (result.recordset[0] as { ID_licencia_conducir: number } | undefined)
    ?.ID_licencia_conducir;
  if (!idLicencia) throw new Error(`No se pudo crear la licencia de la persona ${idPersona}.`);
  await pool
    .request()
    .input('id', sql.Int, idLicencia)
    .query(
      'UPDATE dbo.LicenciaConducir SET verificada_licencia = 1 WHERE ID_licencia_conducir = @id',
    );
  console.log(`OK   licencia verificada persona ${idPersona} (ID ${idLicencia}).`);
}

async function ensureProveedor(idUsuario: number, idAdmin: number): Promise<number> {
  const existente = (await proveedorRepo.findProveedorByUsuario(idUsuario)) as
    | { id: number; estado: string }
    | null;

  let idProveedor: number;
  if (existente) {
    idProveedor = existente.id;
    console.log(`SKIP proveedor AutoDemo (ID ${idProveedor}).`);
  } else {
    const idPersona = await proveedorRepo.findPersonaIdByUsuario(idUsuario);
    const idTipo = await proveedorRepo.findTipoProveedorId('PERSONA');
    if (!idPersona || !idTipo) {
      throw new Error('No se pudo resolver persona/tipo para el proveedor demo.');
    }
    const creado = await proveedorRepo.registrarProveedor({
      ID_tipo_proveedor: idTipo,
      ID_persona_proveedor: idPersona,
      nombre_comercial: 'AutoDemo',
      telefono: '+56911111111',
      email: 'proveedor@rentacar.cl',
    });
    idProveedor = creado.ID_proveedor;
    console.log(`OK   proveedor AutoDemo (ID ${idProveedor}).`);
  }

  await proveedorRepo.asignarRol(idUsuario, 'PROVEEDOR', idUsuario);
  await proveedorRepo.vincularUsuario(idProveedor, idUsuario, true);
  await proveedorRepo.aprobarProveedor(idProveedor, idAdmin);
  await proveedorRepo.actualizarConfiguracion(idProveedor, {
    permite_devolucion_otra_sede: true,
    minutos_expiracion_reserva: 30,
    requiere_deposito: false,
    monto_deposito: 0,
    dias_minimos_arriendo: 1,
    dias_maximos_arriendo: 60,
  });
  return idProveedor;
}

async function ensureSede(
  idProveedor: number,
  nombre: string,
  comuna: string,
  direccion: string,
): Promise<number> {
  const sedes = (await proveedorRepo.listarSedes(idProveedor)) as { id: number; nombre: string }[];
  const existente = sedes.find((s) => s.nombre === nombre);
  if (existente) {
    console.log(`SKIP sede ${nombre} (ID ${existente.id}).`);
    return existente.id;
  }

  const idComuna = await findComuna(comuna);
  const creada = (await proveedorRepo.registrarSede(idProveedor, {
    ID_comuna: idComuna,
    nombre,
    direccion,
    telefono: '+56911111111',
    email: 'sede@rentacar.cl',
    activo: true,
  })) as { ID_sede_proveedor: number };
  console.log(`OK   sede ${nombre} (ID ${creada.ID_sede_proveedor}).`);
  return creada.ID_sede_proveedor;
}

async function ensureVehiculoSede(
  idVehiculo: number,
  idSede: number,
  permiteEntrega: boolean,
  permiteDevolucion: boolean,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('idVehiculo', sql.Int, idVehiculo)
    .input('idSede', sql.Int, idSede)
    .input('entrega', sql.Bit, permiteEntrega)
    .input('devolucion', sql.Bit, permiteDevolucion)
    .query(
      `IF EXISTS (
         SELECT 1 FROM dbo.VehiculoSede
         WHERE ID_vehiculo_vehiculo_sede = @idVehiculo
           AND ID_sede_proveedor_vehiculo_sede = @idSede)
       BEGIN
         UPDATE dbo.VehiculoSede
         SET disponible_para_entrega_vehiculo_sede = @entrega,
             disponible_para_devolucion_vehiculo_sede = @devolucion
         WHERE ID_vehiculo_vehiculo_sede = @idVehiculo
           AND ID_sede_proveedor_vehiculo_sede = @idSede;
       END
       ELSE
       BEGIN
         INSERT INTO dbo.VehiculoSede
           (ID_vehiculo_vehiculo_sede, ID_sede_proveedor_vehiculo_sede,
            disponible_para_entrega_vehiculo_sede, disponible_para_devolucion_vehiculo_sede)
         VALUES (@idVehiculo, @idSede, @entrega, @devolucion);
       END`,
    );
}

async function ensureDocumentos(idVehiculo: number): Promise<void> {
  const pool = await getPool();
  const vigentes = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM dbo.DocumentoVehiculo
       WHERE ID_vehiculo_documento_vehiculo = @id
         AND activo_documento = 1
         AND fecha_vencimiento_documento >= DATEADD(YEAR, 1, CAST(GETDATE() AS DATE))`,
    );
  if ((vigentes.recordset[0]?.total ?? 0) >= 3) {
    await pool
      .request()
      .input('id', sql.Int, idVehiculo)
      .query(
        `UPDATE dbo.DocumentoVehiculo
         SET verificado_documento = 1
         WHERE ID_vehiculo_documento_vehiculo = @id AND activo_documento = 1`,
      );
    console.log(`SKIP documentos vehiculo ${idVehiculo} (ya existen).`);
    return;
  }

  const vencimiento = fechaLocalAnios(2);
  for (const idTipo of [1, 2, 3]) {
    const result = await pool
      .request()
      .input('ID_vehiculo', sql.Int, idVehiculo)
      .input('ID_tipo_documento', sql.Int, idTipo)
      .input('numero_documento', sql.VarChar(50), `DEMO-${idTipo}`)
      .input('fecha_emision', sql.Date, fechaLocal())
      .input('fecha_vencimiento', sql.Date, vencimiento)
      .input('url_archivo', sql.VarChar(500), null)
      .execute('u_sp_RegistrarDocumentoVehiculo');
    const idDocumento = (result.recordset[0] as { ID_documento_vehiculo: number } | undefined)
      ?.ID_documento_vehiculo;
    if (idDocumento) {
      await pool
        .request()
        .input('id', sql.Int, idDocumento)
        .query(
          'UPDATE dbo.DocumentoVehiculo SET verificado_documento = 1 WHERE ID_documento_vehiculo = @id',
        );
    }
  }
  console.log(`OK   documentos verificados vehiculo ${idVehiculo}.`);
}

async function ensureVehiculo(
  idProveedor: number,
  idSede: number,
  idAdmin: number,
  data: (typeof VEHICULOS_DEMO)[number],
): Promise<number> {
  let idVehiculo = await findVehiculoPorPatente(data.patente);
  if (idVehiculo) {
    console.log(`SKIP vehiculo ${data.patente} (ID ${idVehiculo}).`);
  } else {
    const creado = (await vehiculoRepo.registrarVehiculo({
      ID_proveedor: idProveedor,
      ID_modelo: data.ID_modelo,
      ID_tipo_vehiculo: data.ID_tipo_vehiculo,
      ID_tipo_combustible: data.ID_tipo_combustible,
      ID_tipo_transmision: data.ID_tipo_transmision,
      patente: data.patente,
      vin: data.vin,
      anio: data.anio,
      kilometraje: data.kilometraje,
      precio_diario_base: data.precio,
      ID_sede_actual: idSede,
    })) as { ID_vehiculo: number };
    idVehiculo = creado.ID_vehiculo;
    console.log(`OK   vehiculo ${data.patente} (ID ${idVehiculo}).`);
  }

  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .input('idSede', sql.Int, idSede)
    .input('km', sql.Int, data.kilometraje)
    .query(
      `IF NOT EXISTS (
         SELECT 1
         FROM dbo.Arriendo a
         INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
         INNER JOIN dbo.EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
         WHERE r.ID_vehiculo_reserva = @id AND ea.nombre_estado_arriendo = 'ACTIVO')
       UPDATE dbo.Vehiculo
       SET ID_estado_vehiculo_vehiculo =
             (SELECT ID_estado_vehiculo FROM dbo.EstadoVehiculo WHERE nombre_estado_vehiculo='DISPONIBLE'),
           ID_sede_actual_vehiculo = @idSede,
           kilometraje_vehiculo = @km
       WHERE ID_vehiculo = @id`,
    );

  const tarifas = (await vehiculoRepo.listarTarifas(idVehiculo)) as { nombre: string }[];  if (!tarifas.some((t) => t.nombre === 'Tarifa Demo')) {
    await vehiculoRepo.registrarTarifa(idVehiculo, idProveedor, {
      nombre: 'Tarifa Demo',
      fecha_inicio: fechaLocal(),
      fecha_fin: fechaLocalAnios(2),
      precio_dia: data.precio,
      prioridad: 10,
      dias_minimos: 1,
      dias_maximos: 60,
    });
    console.log(`OK   tarifa demo vehiculo ${data.patente}.`);
  }

  await ensureDocumentos(idVehiculo);
  await vehiculoRepo.publicarVehiculo(idVehiculo, idAdmin);
  return idVehiculo;
}

async function main(): Promise<void> {
  const idAdmin = await ensureUsuario(DEMO_USERS[0]);
  const idCliente = await ensureUsuario(DEMO_USERS[1]);
  const idProveedorUsuario = await ensureUsuario(DEMO_USERS[2]);

  const idPersonaCliente = await proveedorRepo.findPersonaIdByUsuario(idCliente);
  if (!idPersonaCliente) throw new Error('No se encontro la persona del cliente demo.');
  await ensureLicencia(idPersonaCliente, 'DEMO-CLIENTE');

  const idPersonaConductor = await ensurePersonaExtra(
    '44444444-4',
    'Conductor',
    'Demo Adicional',
  );
  await ensureLicencia(idPersonaConductor, 'DEMO-CONDUCTOR');

  const idProveedor = await ensureProveedor(idProveedorUsuario, idAdmin);
  const idSedeCentro = await ensureSede(
    idProveedor,
    'Sede Santiago Centro',
    'Santiago',
    'Alameda 1234',
  );
  const idSedeProvidencia = await ensureSede(
    idProveedor,
    'Sede Providencia',
    'Providencia',
    'Av. Providencia 5678',
  );

  for (const data of VEHICULOS_DEMO) {
    const idVehiculo = await ensureVehiculo(idProveedor, idSedeCentro, idAdmin, data);
    await ensureVehiculoSede(idVehiculo, idSedeCentro, true, true);
    await ensureVehiculoSede(idVehiculo, idSedeProvidencia, true, true);
  }

  console.log('');
  console.log('Datos demo listos:');
  console.log(`  admin:     admin@rentacar.cl / Admin1234!    (ID ${idAdmin})`);
  console.log(`  cliente:   demo@rentacar.cl / Demo1234!     (ID ${idCliente})`);
  console.log(
    `  proveedor: proveedor@rentacar.cl / Proveedor1234! (ID ${idProveedorUsuario}, proveedor ${idProveedor})`,
  );
  console.log('  Sedes: Santiago Centro y Providencia.');
  console.log('  Vehiculos: DEMA01 (Toyota Corolla) y DEMB02 (Hyundai Tucson).');
  console.log('  Licencias: cliente demo y conductor adicional verificadas.');
  console.log('  Conductor adicional: 44444444-4 (Conductor Demo Adicional).');

  await closePool();
}

main().catch(async (err: unknown) => {
  console.error('Error en el seed:', (err as Error).message);
  await closePool().catch(() => undefined);
  process.exit(1);
});
