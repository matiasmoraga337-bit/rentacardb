# Disputas (S4-E10.3)

Cliente o proveedor puede abrir una disputa sobre un arriendo finalizado. Un
administrador la revisa y resuelve.

## Reglas

- Solo arriendo `FINALIZADO`.
- Autor debe ser el cliente del arriendo o un usuario vinculado al proveedor.
- Una disputa abierta (`ABIERTA` o `EN_REVISION`) por arriendo y autor.
- Tipos: `DANO`, `COBRO`, `SERVICIO`, `DOCUMENTO`, `OTRO`.
- Descripcion de 10 a 1000 caracteres; monto disputado opcional y positivo.
- Estados: `ABIERTA → EN_REVISION → RESUELTA|CERRADA`.
- Para `RESUELTA`/`CERRADA` la resolución es obligatoria y se registra la fecha de cierre.

## API

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| GET | `/api/disputas?scope=&estado=&arriendo=&page=&pageSize=` | AUTH | Lista segun rol; ADMIN puede usar `scope=todos`. |
| POST | `/api/disputas` | AUTH parte | Body `{ID_arriendo, tipo_disputa, descripcion, monto_disputado?}`. |
| GET | `/api/disputas/:id` | AUTH parte/ADMIN | Detalle. |
| POST | `/api/disputas/:id/resolver` | ADMIN | Body `{estado, resolucion?}`. |

## UI

- `DisputaForm` en el detalle del arriendo finalizado (cliente/proveedor).
- `/disputas`: listado para cliente y proveedor.
- `/admin/disputas`: bandeja ADMIN con “Tomar en revision” y resolución.
- Accesos en paneles y navegación.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `ARRIENDO_NO_FINALIZADO` | 409 | Arriendo no existe o no finalizado. |
| `DISPUTA_DUPLICADA` | 409 | Ya hay una disputa abierta. |
| `AUTOR_NO_CORRESPONDE` | 403 | Usuario ajeno al arriendo. |
| `MONTO_INVALIDO` | 400 | Monto disputado <= 0. |
| `TIPO_DISPUTA_INVALIDO` | 400 | Tipo fuera del catalogo. |
| `DISPUTA_CERRADA` | 409 | Ya fue resuelta/cerrada. |
| `RESOLUCION_REQUERIDA` | 400 | Cierre sin resolución. |

## Pruebas

- SQL: `sql/tests/09_disputas.sql` (6 casos).
- API: `Producción/backend/tests/disputas.test.ts`.
- UI: formulario y bandeja admin.
- Smoke: pendiente de ampliar en `smoke-s4`.
