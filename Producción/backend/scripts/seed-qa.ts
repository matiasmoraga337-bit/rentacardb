/**
 * Seed de datos de prueba extendidos.
 * Uso: npm run seed:qa
 *
 * Requiere la base creada y, idealmente, `npm run seed` ejecutado antes.
 * Es idempotente: no duplica usuarios, proveedores, sedes, vehículos,
 * documentos ni tarifas existentes.
 */
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { closePool, getPool } from '../src/config/db';
import * as authRepo from '../src/repositories/auth.repository';
import * as proveedorRepo from '../src/repositories/proveedor.repository';
import * as vehiculoRepo from '../src/repositories/vehiculo.repository';

interface CuentaQa {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  email: string;
  password: string;
  rol: string;
}

interface SedeQa {
  nombre: string;
  comuna: string;
  direccion: string;
}

interface VehiculoQa {
  patente: string;
  marca: string;
  modelo: string;
  tipo: string;
  combustible: string;
  transmision: string;
  anio: number;
  kilometraje: number;
  precio: number;
  comuna: string;
  direccion: string;
}

const CUENTAS: CuentaQa[] = [
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
    rut: '55555555-5',
    nombres: 'Cliente',
    apellidoPaterno: 'Dos',
    email: 'cliente2@rentacar.cl',
    password: 'Cliente1234!',
    rol: 'CLIENTE',
  },
  {
    rut: '66666666-6',
    nombres: 'Proveedor',
    apellidoPaterno: 'Flota',
    email: 'flota@rentacar.cl',
    password: 'Flota1234!',
    rol: 'PROVEEDOR',
  },
  {
    rut: '77777777-7',
    nombres: 'Proveedor',
    apellidoPaterno: 'Unico',
    email: 'unico@rentacar.cl',
    password: 'Unico1234!',
    rol: 'PROVEEDOR',
  },
];

const FLOTA: VehiculoQa[] = [
  { patente: 'FLAA01', marca: 'Toyota', modelo: 'Yaris', tipo: 'HATCHBACK', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 12000, precio: 21990, comuna: 'Arica', direccion: 'Av. Chile 101' },
  { patente: 'FLAA02', marca: 'Nissan', modelo: 'Versa', tipo: 'SEDAN', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2023, kilometraje: 28000, precio: 22990, comuna: 'Iquique', direccion: 'Av. Costanera 202' },
  { patente: 'FLAA03', marca: 'Mazda', modelo: 'CX-5', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 15000, precio: 42990, comuna: 'Antofagasta', direccion: 'Av. Argentina 303' },
  { patente: 'FLAA04', marca: 'Chevrolet', modelo: 'Sail', tipo: 'SEDAN', combustible: 'GASOLINA', transmision: 'MANUAL', anio: 2022, kilometraje: 42000, precio: 19990, comuna: 'Copiapó', direccion: 'Av. Copayapu 404' },
  { patente: 'FLAA05', marca: 'Hyundai', modelo: 'Accent', tipo: 'SEDAN', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2023, kilometraje: 31000, precio: 23990, comuna: 'La Serena', direccion: 'Av. del Mar 505' },
  { patente: 'FLAA06', marca: 'Kia', modelo: 'Sportage', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 18000, precio: 39990, comuna: 'Viña del Mar', direccion: 'Av. San Martín 606' },
  { patente: 'FLAA07', marca: 'Toyota', modelo: 'Prius', tipo: 'HATCHBACK', combustible: 'HIBRIDO', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 9000, precio: 34990, comuna: 'Santiago', direccion: 'Av. Libertador 707' },
  { patente: 'FLAA08', marca: 'Suzuki', modelo: 'Swift', tipo: 'HATCHBACK', combustible: 'GASOLINA', transmision: 'MANUAL', anio: 2023, kilometraje: 26000, precio: 20990, comuna: 'Rancagua', direccion: 'Av. Cachapoal 808' },
  { patente: 'FLAA09', marca: 'Peugeot', modelo: '208', tipo: 'HATCHBACK', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 11000, precio: 22990, comuna: 'Talca', direccion: 'Av. Maule 909' },
  { patente: 'FLAA10', marca: 'Renault', modelo: 'Duster', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'MANUAL', anio: 2022, kilometraje: 39000, precio: 28990, comuna: 'Chillán', direccion: 'Av. Ñuble 1010' },
  { patente: 'FLAA11', marca: 'Ford', modelo: 'Ranger', tipo: 'PICKUP', combustible: 'DIESEL', transmision: 'AUTOMATICA', anio: 2023, kilometraje: 34000, precio: 45990, comuna: 'Concepción', direccion: 'Av. Biobío 1111' },
  { patente: 'FLAA12', marca: 'Volkswagen', modelo: 'T-Cross', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 14000, precio: 32990, comuna: 'Temuco', direccion: 'Av. Araucanía 1212' },
  { patente: 'FLAA13', marca: 'Honda', modelo: 'CR-V', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2023, kilometraje: 22000, precio: 41990, comuna: 'Valdivia', direccion: 'Av. Los Ríos 1313' },
  { patente: 'FLAA14', marca: 'Mitsubishi', modelo: 'L200', tipo: 'PICKUP', combustible: 'DIESEL', transmision: 'MANUAL', anio: 2022, kilometraje: 48000, precio: 44990, comuna: 'Puerto Montt', direccion: 'Av. Llanquihue 1414' },
  { patente: 'FLAA15', marca: 'Subaru', modelo: 'Forester', tipo: 'SUV', combustible: 'GASOLINA', transmision: 'AUTOMATICA', anio: 2023, kilometraje: 27000, precio: 38990, comuna: 'Coihaique', direccion: 'Av. Aysén 1515' },
  { patente: 'FLAA16', marca: 'Toyota', modelo: 'Hilux', tipo: 'PICKUP', combustible: 'DIESEL', transmision: 'AUTOMATICA', anio: 2024, kilometraje: 16000, precio: 46990, comuna: 'Punta Arenas', direccion: 'Av. Magallanes 1616' },
];

const UNICO: VehiculoQa = {
  patente: 'UNAA01',
  marca: 'Suzuki',
  modelo: 'Jimny',
  tipo: 'SUV',
  combustible: 'GASOLINA',
  transmision: 'MANUAL',
  anio: 2024,
  kilometraje: 8000,
  precio: 29990,
  comuna: 'Natales',
  direccion: 'Av. Última Esperanza 1717',
};

const FECHA_INICIO = fechaLocal();
const FECHA_FIN = fechaLocalAnios(2);

function fechaLocal(offsetDias = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDias);
  return toIsoDate(date);
}

function fechaLocalAnios(anios: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + anios);
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
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

async function ensureUsuario(cuenta: CuentaQa): Promise<number> {
  const existente = await findUserId(cuenta.email);
  if (existente) {
    console.log(`SKIP usuario ${cuenta.email} (ID ${existente}).`);
    return existente;
  }

  const passwordHash = await bcrypt.hash(cuenta.password, 10);
  const row = await authRepo.registrarUsuario({
    rut: cuenta.rut,
    nombres: cuenta.nombres,
    apellidoPaterno: cuenta.apellidoPaterno,
    email: cuenta.email,
    passwordHash,
    rol: cuenta.rol,
  });
  if (!row) throw new Error(`No se pudo crear el usuario ${cuenta.email}.`);
  console.log(`OK   usuario ${cuenta.email} (ID ${row.ID_usuario}).`);
  return row.ID_usuario;
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
  const id = result.recordset[0]?.ID_comuna;
  if (!id) throw new Error(`No existe la comuna ${nombre}.`);
  return id;
}

async function idPorNombre(
  tabla: string,
  idColumna: string,
  nombreColumna: string,
  valor: string,
): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('valor', sql.NVarChar(100), valor)
    .query<{ id: number }>(
      `SELECT TOP 1 ${idColumna} AS id FROM dbo.${tabla}
       WHERE ${nombreColumna} = @valor ORDER BY ${idColumna}`,
    );
  const id = result.recordset[0]?.id;
  if (!id) throw new Error(`No existe ${valor} en ${tabla}.`);
  return id;
}

async function ensureMarca(nombre: string): Promise<number> {
  const existente = await idPorNombreOpcional('Marca', 'ID_marca', 'nombre_marca', nombre);
  if (existente) return existente;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('nombre', sql.VarChar(100), nombre)
    .query<{ id: number }>(
      `INSERT INTO dbo.Marca (nombre_marca, activo_marca)
       OUTPUT inserted.ID_marca AS id VALUES (@nombre, 1)`,
    );
  return result.recordset[0].id;
}

async function ensureModelo(idMarca: number, nombre: string): Promise<number> {
  const pool = await getPool();
  const existente = await pool
    .request()
    .input('idMarca', sql.Int, idMarca)
    .input('nombre', sql.VarChar(100), nombre)
    .query<{ id: number }>(
      `SELECT TOP 1 ID_modelo AS id FROM dbo.Modelo
       WHERE ID_marca_modelo = @idMarca AND nombre_modelo = @nombre`,
    );
  if (existente.recordset[0]?.id) return existente.recordset[0].id;

  const result = await pool
    .request()
    .input('idMarca', sql.Int, idMarca)
    .input('nombre', sql.VarChar(100), nombre)
    .query<{ id: number }>(
      `INSERT INTO dbo.Modelo (ID_marca_modelo, nombre_modelo, activo_modelo)
       OUTPUT inserted.ID_modelo AS id VALUES (@idMarca, @nombre, 1)`,
    );
  return result.recordset[0].id;
}

async function idPorNombreOpcional(
  tabla: string,
  idColumna: string,
  nombreColumna: string,
  valor: string,
): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('valor', sql.NVarChar(100), valor)
    .query<{ id: number }>(
      `SELECT TOP 1 ${idColumna} AS id FROM dbo.${tabla}
       WHERE ${nombreColumna} = @valor ORDER BY ${idColumna}`,
    );
  return result.recordset[0]?.id ?? null;
}

async function ensureLicencia(idPersona: number, numero: string): Promise<void> {
  const pool = await getPool();
  const clase = await idPorNombre('ClaseLicencia', 'ID_clase_licencia', 'codigo_clase_licencia', 'B');
  const existente = await pool
    .request()
    .input('idPersona', sql.Int, idPersona)
    .query<{ id: number }>(
      `SELECT TOP 1 ID_licencia_conducir AS id FROM dbo.LicenciaConducir
       WHERE ID_persona_licencia_conducir = @idPersona AND activa_licencia = 1`,
    );
  if (existente.recordset[0]?.id) {
    await pool
      .request()
      .input('id', sql.Int, existente.recordset[0].id)
      .query('UPDATE dbo.LicenciaConducir SET verificada_licencia = 1 WHERE ID_licencia_conducir = @id');
    console.log(`SKIP licencia ${numero} (persona ${idPersona}).`);
    return;
  }
  await pool
    .request()
    .input('ID_persona', sql.Int, idPersona)
    .input('ID_clase_licencia', sql.Int, clase)
    .input('numero_licencia', sql.VarChar(20), numero)
    .input('fecha_emision', sql.Date, fechaLocal(-365))
    .input('fecha_vencimiento', sql.Date, FECHA_FIN)
    .input('url_archivo', sql.VarChar(500), null)
    .execute('u_sp_RegistrarLicenciaConducir');
  await pool
    .request()
    .input('idPersona', sql.Int, idPersona)
    .input('numero', sql.VarChar(20), numero)
    .query(
      `UPDATE dbo.LicenciaConducir SET verificada_licencia = 1
       WHERE ID_persona_licencia_conducir = @idPersona AND numero_licencia = @numero`,
    );
  console.log(`OK   licencia ${numero} (persona ${idPersona}).`);
}

async function ensureProveedor(
  idUsuario: number,
  idAdmin: number,
  nombreComercial: string,
  email: string,
): Promise<number> {
  const existente = (await proveedorRepo.findProveedorByUsuario(idUsuario)) as
    | { id: number; estado: string }
    | null;

  let idProveedor: number;
  if (existente) {
    idProveedor = existente.id;
    console.log(`SKIP proveedor ${nombreComercial} (ID ${idProveedor}).`);
  } else {
    const idPersona = await proveedorRepo.findPersonaIdByUsuario(idUsuario);
    const idTipo = await proveedorRepo.findTipoProveedorId('PERSONA');
    if (!idPersona || !idTipo) throw new Error(`No se pudo resolver persona/tipo de ${email}.`);
    const creado = await proveedorRepo.registrarProveedor({
      ID_tipo_proveedor: idTipo,
      ID_persona_proveedor: idPersona,
      nombre_comercial: nombreComercial,
      telefono: '+56922222222',
      email,
    });
    idProveedor = creado.ID_proveedor;
    console.log(`OK   proveedor ${nombreComercial} (ID ${idProveedor}).`);
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
  data: SedeQa,
): Promise<number> {
  const sedes = (await proveedorRepo.listarSedes(idProveedor)) as { id: number; nombre: string }[];
  const existente = sedes.find((sede) => sede.nombre === data.nombre);
  if (existente) return existente.id;

  const idComuna = await findComuna(data.comuna);
  const creada = (await proveedorRepo.registrarSede(idProveedor, {
    ID_comuna: idComuna,
    nombre: data.nombre,
    direccion: data.direccion,
    telefono: '+56922222222',
    email: 'sedes.qa@rentacar.cl',
    activo: true,
  })) as { ID_sede_proveedor: number };
  console.log(`OK   sede ${data.nombre} (ID ${creada.ID_sede_proveedor}).`);
  return creada.ID_sede_proveedor;
}

async function ensureVehiculoSede(idVehiculo: number, idSede: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('idVehiculo', sql.Int, idVehiculo)
    .input('idSede', sql.Int, idSede)
    .query(
      `IF EXISTS (
         SELECT 1 FROM dbo.VehiculoSede
         WHERE ID_vehiculo_vehiculo_sede = @idVehiculo
           AND ID_sede_proveedor_vehiculo_sede = @idSede)
       BEGIN
         UPDATE dbo.VehiculoSede
         SET disponible_para_entrega_vehiculo_sede = 1,
             disponible_para_devolucion_vehiculo_sede = 1
         WHERE ID_vehiculo_vehiculo_sede = @idVehiculo
           AND ID_sede_proveedor_vehiculo_sede = @idSede;
       END
       ELSE
       BEGIN
         INSERT INTO dbo.VehiculoSede
           (ID_vehiculo_vehiculo_sede, ID_sede_proveedor_vehiculo_sede,
            disponible_para_entrega_vehiculo_sede, disponible_para_devolucion_vehiculo_sede)
         VALUES (@idVehiculo, @idSede, 1, 1);
       END`,
    );
}

async function ensureDocumentos(idVehiculo: number, patente: string): Promise<void> {
  const pool = await getPool();
  const vigentes = await pool
    .request()
    .input('id', sql.Int, idVehiculo)
    .query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM dbo.DocumentoVehiculo
       WHERE ID_vehiculo_documento_vehiculo = @id
         AND activo_documento = 1
         AND fecha_vencimiento_documento >= DATEADD(YEAR, 1, CAST(GETDATE() AS DATE))`,
    );
  if ((vigentes.recordset[0]?.total ?? 0) >= 3) {
    await pool
      .request()
      .input('id', sql.Int, idVehiculo)
      .query(
        `UPDATE dbo.DocumentoVehiculo SET verificado_documento = 1
         WHERE ID_vehiculo_documento_vehiculo = @id AND activo_documento = 1`,
      );
    return;
  }

  for (const idTipo of [1, 2, 3]) {
    const result = await vehiculoRepo.registrarDocumento(
      idVehiculo,
      idTipo,
      `QA-${patente}-${idTipo}`,
      FECHA_INICIO,
      FECHA_FIN,
      null,
    );
    const idDocumento = (result as { ID_documento_vehiculo?: number } | null)
      ?.ID_documento_vehiculo;
    if (idDocumento) {
      await pool
        .request()
        .input('id', sql.Int, idDocumento)
        .query('UPDATE dbo.DocumentoVehiculo SET verificado_documento = 1 WHERE ID_documento_vehiculo = @id');
    }
  }
}

async function ensureVehiculo(
  idProveedor: number,
  idAdmin: number,
  idSede: number,
  data: VehiculoQa,
): Promise<number> {
  const pool = await getPool();
  const existente = await pool
    .request()
    .input('patente', sql.VarChar(10), data.patente)
    .query<{ id: number }>('SELECT ID_vehiculo AS id FROM dbo.Vehiculo WHERE patente_vehiculo = @patente');
  let idVehiculo = existente.recordset[0]?.id;

  if (!idVehiculo) {
    const idMarca = await ensureMarca(data.marca);
    const idModelo = await ensureModelo(idMarca, data.modelo);
    const idTipo = await idPorNombre('TipoVehiculo', 'ID_tipo_vehiculo', 'nombre_tipo_vehiculo', data.tipo);
    const idCombustible = await idPorNombre('TipoCombustible', 'ID_tipo_combustible', 'nombre_tipo_combustible', data.combustible);
    const idTransmision = await idPorNombre('TipoTransmision', 'ID_tipo_transmision', 'nombre_tipo_transmision', data.transmision);
    const creado = (await vehiculoRepo.registrarVehiculo({
      ID_proveedor: idProveedor,
      ID_modelo: idModelo,
      ID_tipo_vehiculo: idTipo,
      ID_tipo_combustible: idCombustible,
      ID_tipo_transmision: idTransmision,
      patente: data.patente,
      vin: data.patente === UNICO.patente
        ? 'QAUNICO0000000001'
        : `QAFLOTA${String(FLOTA.indexOf(data) + 1).padStart(10, '0')}`,
      anio: data.anio,
      kilometraje: data.kilometraje,
      precio_diario_base: data.precio,
      ID_sede_actual: idSede,
    })) as { ID_vehiculo: number };
    idVehiculo = creado.ID_vehiculo;
    console.log(`OK   vehiculo ${data.patente} (ID ${idVehiculo}).`);
  } else {
    console.log(`SKIP vehiculo ${data.patente} (ID ${idVehiculo}).`);
  }

  await ensureVehiculoSede(idVehiculo, idSede);
  const tarifas = (await vehiculoRepo.listarTarifas(idVehiculo)) as { nombre: string }[];
  if (!tarifas.some((tarifa) => tarifa.nombre === 'Tarifa QA')) {
    await vehiculoRepo.registrarTarifa(idVehiculo, idProveedor, {
      nombre: 'Tarifa QA',
      fecha_inicio: FECHA_INICIO,
      fecha_fin: FECHA_FIN,
      precio_dia: data.precio,
      prioridad: 10,
      dias_minimos: 1,
      dias_maximos: 60,
    });
  }
  await ensureDocumentos(idVehiculo, data.patente);
  await vehiculoRepo.publicarVehiculo(idVehiculo, idAdmin);
  return idVehiculo;
}

async function main(): Promise<void> {
  const ids = new Map<string, number>();
  for (const cuenta of CUENTAS) {
    ids.set(cuenta.email, await ensureUsuario(cuenta));
  }

  const idAdmin = ids.get('admin@rentacar.cl');
  if (!idAdmin) throw new Error('No se encontro el admin QA.');
  const idCliente2 = ids.get('cliente2@rentacar.cl');
  if (!idCliente2) throw new Error('No se encontro cliente2.');

  const personaCliente2 = await proveedorRepo.findPersonaIdByUsuario(idCliente2);
  if (personaCliente2) await ensureLicencia(personaCliente2, 'QA-CLIENTE-2');

  const idFlotaUsuario = ids.get('flota@rentacar.cl');
  const idUnicoUsuario = ids.get('unico@rentacar.cl');
  if (!idFlotaUsuario || !idUnicoUsuario) throw new Error('No se encontraron los proveedores QA.');

  const idFlota = await ensureProveedor(idFlotaUsuario, idAdmin, 'Flota Chile', 'flota@rentacar.cl');
  const idUnico = await ensureProveedor(idUnicoUsuario, idAdmin, 'Renta Natales', 'unico@rentacar.cl');

  for (const data of FLOTA) {
    const idSede = await ensureSede(idFlota, {
      nombre: `Sede ${data.comuna}`,
      comuna: data.comuna,
      direccion: data.direccion,
    });
    await ensureVehiculo(idFlota, idAdmin, idSede, data);
  }

  const idSedeUnica = await ensureSede(idUnico, {
    nombre: 'Sede Natales',
    comuna: UNICO.comuna,
    direccion: UNICO.direccion,
  });
  await ensureVehiculo(idUnico, idAdmin, idSedeUnica, UNICO);

  console.log('');
  console.log('Datos QA listos:');
  for (const cuenta of CUENTAS) {
    console.log(`  ${cuenta.email.padEnd(28)} ${cuenta.password} (${cuenta.rol})`);
  }
  console.log(`  Flota Chile: ${FLOTA.length} vehiculos en 16 regiones.`);
  console.log('  Renta Natales: 1 vehiculo en Natales.');
  console.log('  Ejecuta npm run seed:fotos para subir las fotos.');

  await closePool();
}

main().catch(async (error: unknown) => {
  console.error('Error en seed:qa:', (error as Error).message);
  await closePool().catch(() => undefined);
  process.exit(1);
});
