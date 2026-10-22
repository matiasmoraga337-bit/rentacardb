# Adjuntos y fotos (S4-E12.2/E9.3)

## Fotos de inspeccion

- `POST /api/arriendos/:id/inspecciones/:inspeccionId/fotos` con `multipart/form-data`.
- Campo `fotos` (hasta 8 imagenes JPG/PNG/WebP/AVIF).
- Solo operador/proveedor/admin con acceso al arriendo.
- Se guardan como WebP con thumbnail en `uploads/inspecciones/<arriendo>/<inspeccion>/`.
- `GET /api/arriendos/:id` incluye `inspecciones[].fotos[]`.

## Adjuntos de chat

- `POST /api/conversaciones/:id/mensajes/:mensajeId/adjuntos` con `multipart/form-data`.
- Campo `archivos` (hasta 4; imagenes o PDF).
- Solo participantes de la conversacion.
- Se guardan en `uploads/adjuntos/<conversacion>/`.
- `GET /api/conversaciones/:id/mensajes` incluye `adjuntos[]` por mensaje.

## UI

- `InspeccionFotos` permite subir y ver fotos en cada inspeccion del arriendo.
- Chat: selector de archivos junto al mensaje; los adjuntos se muestran como enlaces.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `INSPECCION_NO_ENCONTRADA` | 404 | Inspeccion inexistente o de otro arriendo. |
| `SIN_ARCHIVOS` | 400 | Sin archivos. |
| `MIME_INVALIDO` | 400 | Tipo no permitido. |
| `MENSAJE_NO_ENCONTRADO` | 404 | Mensaje inexistente. |
| `FORBIDDEN` | 403 | Usuario ajeno a la conversacion. |
| `ADJUNTO_INVALIDO` | 400 | URL o tamano invalido. |

## Pruebas

- SQL: `sql/tests/12_adjuntos_fotos.sql` (6 casos).
- UI: galeria de fotos y adjuntos en chat.
