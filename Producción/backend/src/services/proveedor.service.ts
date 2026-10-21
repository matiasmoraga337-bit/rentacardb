import * as repo from '../repositories/proveedor.repository';
import {
  type ConfiguracionInput,
  type RegistrarProveedorInput,
  type SedeCreateInput,
  type SedeUpdateInput,
} from '../schemas/proveedor.schema';
import { AppError } from '../utils/AppError';

async function assertAcceso(idProveedor: number, idUsuario: number): Promise<void> {
  if (await repo.esAdmin(idUsuario)) return;
  if (await repo.esProveedorDeUsuario(idProveedor, idUsuario)) return;
  throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a este proveedor.');
}

export async function registrar(
  idUsuario: number,
  input: RegistrarProveedorInput,
): Promise<unknown> {
  const idTipo = await repo.findTipoProveedorId(input.tipo);
  if (!idTipo) {
    throw new AppError(400, 'TIPO_PROVEEDOR_INVALIDO', 'Tipo de proveedor invalido.');
  }

  let idPersona: number | null = null;
  if (input.tipo === 'PERSONA') {
    idPersona = await repo.findPersonaIdByUsuario(idUsuario);
    if (!idPersona) {
      throw new AppError(400, 'PERSONA_NO_ENCONTRADA', 'El usuario no tiene persona asociada.');
    }
  }

  const creado = await repo.registrarProveedor({
    ID_tipo_proveedor: idTipo,
    ID_persona_proveedor: idPersona,
    nombre_comercial: input.nombreComercial,
    razon_social: input.razonSocial,
    rut_proveedor: input.rutProveedor,
    telefono: input.telefono,
    email: input.email,
  });

  await repo.asignarRol(idUsuario, 'PROVEEDOR', idUsuario);
  await repo.vincularUsuario(creado.ID_proveedor, idUsuario, true);

  return repo.obtenerProveedor(creado.ID_proveedor);
}

export async function mio(idUsuario: number): Promise<unknown> {
  const proveedor = await repo.findProveedorByUsuario(idUsuario);
  if (!proveedor) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', 'El usuario no tiene proveedor.');
  }
  return proveedor;
}

export async function obtener(idProveedor: number): Promise<unknown> {
  const proveedor = await repo.obtenerProveedor(idProveedor);
  if (!proveedor) {
    throw new AppError(404, 'PROVEEDOR_NO_ENCONTRADO', 'Proveedor no encontrado.');
  }
  return proveedor;
}

export async function listar(estado?: string): Promise<unknown[]> {
  return repo.listarProveedores(estado);
}

export async function aprobar(idProveedor: number, idAdmin: number): Promise<unknown> {
  await repo.aprobarProveedor(idProveedor, idAdmin);
  return obtener(idProveedor);
}

export async function actualizarConfiguracion(
  idProveedor: number,
  idUsuario: number,
  data: ConfiguracionInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.actualizarConfiguracion(idProveedor, data);
}

export async function listarSedes(idProveedor: number, idUsuario: number): Promise<unknown[]> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.listarSedes(idProveedor);
}

export async function crearSede(
  idProveedor: number,
  idUsuario: number,
  data: SedeCreateInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.registrarSede(idProveedor, data);
}

export async function actualizarSede(
  idProveedor: number,
  idSede: number,
  idUsuario: number,
  data: SedeUpdateInput,
): Promise<unknown> {
  await assertAcceso(idProveedor, idUsuario);
  return repo.actualizarSede(idProveedor, idSede, data);
}

export async function eliminarSede(
  idProveedor: number,
  idSede: number,
  idUsuario: number,
): Promise<void> {
  await assertAcceso(idProveedor, idUsuario);
  await repo.eliminarSede(idProveedor, idSede);
}
