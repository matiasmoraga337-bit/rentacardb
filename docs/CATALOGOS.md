# Catalogos administrables (S4-E3.2)

CRUD con soft delete para los catálogos de negocio. Los estados y tipos de
sistema se mantienen como solo lectura.

## Catalogos editables

| Catalogo | Campos |
|---|---|
| `marcas` | nombre, activo |
| `modelos` | marca, nombre, activo |
| `tipos-vehiculo` | nombre, activo |
| `combustibles` | nombre, activo |
| `transmisiones` | nombre, activo |
| `caracteristicas` | nombre, categoria, descripcion, activo |
| `tipos-documento` | nombre, obligatorio, activo |
| `politicas-cancelacion` | nombre, descripcion, dias, porcentaje, activo |

## Solo lectura

- `tipos-proveedor`
- `estados-vehiculo`
- `estados-publicacion`

Motivo: son estados del sistema y desactivarlos puede romper transiciones o
datos existentes.

## API

| Metodo | Ruta | Acceso |
|---|---|---|
| GET | `/api/admin/catalogos/:tipo?incluirInactivos=1` | ADMIN |
| POST | `/api/admin/catalogos/:tipo` | ADMIN |
| PUT | `/api/admin/catalogos/:tipo/:id` | ADMIN |
| DELETE | `/api/admin/catalogos/:tipo/:id` | ADMIN (soft delete) |

Validacion con zod segun catálogo. Errores de negocio:

| Codigo | HTTP | Caso |
|---|---|---|
| `ACCION_CATALOGO_INVALIDA` | 400 | Accion no soportada. |
| `NOMBRE_INVALIDO` | 400 | Nombre vacio. |
| `CATALOGO_NO_ENCONTRADO` | 404 | Registro inexistente. |
| `CATALOGO_DUPLICADO` | 409 | Nombre duplicado. |
| `REFERENCIA_INVALIDA` | 400 | Marca inexistente en modelo. |
| `CATALOGO_SOLO_LECTURA` | 400 | Intento de escribir un catalogo de sistema. |
| `VALOR_INVALIDO` | 400 | Rango/valor invalido. |

## UI

`/admin/catalogos` permite:
- elegir catalogo;
- incluir inactivos;
- crear/editar;
- desactivar;
- ver campos especificos (marca para modelos, categoria/descripcion,
  obligatorio, dias/porcentaje).

## Pruebas

- SQL: `sql/tests/13_catalogos.sql` (8 casos).
- API: validacion y permisos.
- UI: formulario por catalogo.
