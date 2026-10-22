# Favoritos y busquedas guardadas (S4-E6.3/E6.4)

## Favoritos

- `GET /api/favoritos`: vehiculos favoritos del usuario con datos para tarjeta.
- `POST /api/favoritos/:vehiculoId`: agregar (idempotente).
- `DELETE /api/favoritos/:vehiculoId`: quitar.
- UI: corazon en catalogo/ficha del vehiculo y pagina `/favoritos`.

## Busquedas guardadas

- `GET /api/busquedas`: busquedas activas del usuario.
- `POST /api/busquedas`: `{nombre?, ID_comuna?, ID_tipo_vehiculo?, precio_maximo?, fecha_desde?, fecha_hasta?}`.
- `DELETE /api/busquedas/:id`: soft delete.
- UI: boton **Guardar busqueda** en el catalogo y pagina `/busquedas` con **Aplicar**.
- El catalogo acepta `?desde=&hasta=&comuna=&tipo=&precio=` para reconstruir filtros.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `VEHICULO_NO_ENCONTRADO` | 404 | Favorito sobre vehiculo inexistente. |
| `USUARIO_NO_ENCONTRADO` | 404 | Usuario invalido en SP. |
| `FECHAS_INVALIDAS` | 400 | Rango de fechas invalido. |
| `BUSQUEDA_NO_ENCONTRADA` | 404 | Busqueda inexistente o ajena. |

## Pruebas

- SQL: `sql/tests/14_favoritos_busquedas.sql` (8 casos).
- API: `Producción/backend/tests/favoritos.test.ts`.
- UI: corazon, `/favoritos`, guardar y `/busquedas`.
