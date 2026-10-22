# Notificaciones y outbox (S4-E12.3)

Los eventos de negocio se registran en `OutboxEvento`. Un worker los procesa,
envia correo e inserta notificaciones in-app para el destinatario.

## Reglas

- Canales implementados: `EMAIL` y `PUSH` (in-app). SMS queda fuera de alcance.
- La campana usa `GET /notificaciones/no-leidas` y el listado propio.
- `LEIDA` se registra con `fecha_lectura_notificacion`.
- Un usuario solo puede leer sus notificaciones.
- El worker bloquea eventos con `u_sp_ObtenerOutboxPendiente`, procesa y marca con
  `u_sp_MarcarEventoProcesado`.
- Si falla, el evento queda `ERROR`; se reintenta automáticamente hasta 5 intentos
  o manualmente desde `/admin/outbox`.
- Deduplicacion de notificaciones in-app en ventana de 10 minutos para tolerar reintentos.

## Configuracion

| Variable | Default | Uso |
|---|---|---|
| `OUTBOX_JOB_ENABLED` | `false` (Docker: `true`) | Activa el worker. |
| `OUTBOX_JOB_INTERVAL_MS` | `60000` (Docker: `30000`) | Intervalo de polling. |
| `OUTBOX_BATCH_SIZE` | `20` | Eventos por lote. |

`SMTP_*` define el correo; en desarrollo se usa Mailpit (`http://localhost:8026`).

## API

| Metodo | Ruta | Acceso |
|---|---|---|
| GET | `/api/notificaciones?estado=&page=&pageSize=` | AUTH |
| GET | `/api/notificaciones/no-leidas` | AUTH |
| POST | `/api/notificaciones/:id/leer` | AUTH dueño |
| GET | `/api/admin/outbox?estado=&page=&pageSize=` | ADMIN |
| POST | `/api/admin/outbox/:id/reintentar` | ADMIN |

## UI

- Campana con contador en `AppLayout`.
- `/notificaciones`: listado y marcado como leida.
- `/admin/outbox`: monitor de eventos y reintento.

## Pruebas

- SQL: `sql/tests/11_notificaciones_outbox.sql` (8 casos).
- API: `Producción/backend/tests/notificaciones.test.ts`.
- Worker: ejecutar con `OUTBOX_JOB_ENABLED=true` y revisar Mailpit.
