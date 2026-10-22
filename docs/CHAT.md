# Chat cliente-proveedor — S3 (E12)

Mensajería básica entre clientes y proveedores, integrada con los SPs existentes.

## 1. Flujo

1. El cliente abre el detalle público de un vehículo y pulsa **Contactar proveedor**.
2. Se crea (o reutiliza) una conversación activa para ese cliente, proveedor y vehículo.
3. Cliente y proveedor ven la conversación en `/chat`.
4. Los mensajes se actualizan por **polling cada 5 s**.
5. Al abrir una conversación, se marcan como leídos los mensajes del otro participante.
6. Cualquiera de los dos puede cerrar la conversación.

## 2. Endpoints

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET | `/conversaciones` | AUTH | `u_sp_ListarConversaciones` |
| POST | `/conversaciones` | CLIENTE | `u_sp_CrearConversacion` |
| GET | `/conversaciones/:id/mensajes` | AUTH participante | `u_sp_ListarMensajes` |
| POST | `/conversaciones/:id/mensajes` | AUTH participante | `u_sp_EnviarMensaje` |
| POST | `/conversaciones/:id/leidos` | AUTH participante | `u_sp_MarcarMensajesLeidos` |
| POST | `/conversaciones/:id/cerrar` | AUTH participante | `u_sp_CerrarConversacion` |

`POST /conversaciones` recibe `{ ID_proveedor, ID_vehiculo? }`. El usuario sale del JWT.
`POST /conversaciones/:id/mensajes` recibe `{ contenido, ID_mensaje_padre? }`; en S3 solo
se permiten mensajes `TEXTO`.

## 3. Reglas y seguridad

- Los SPs validan que el usuario sea el cliente de la conversación o un usuario del
  proveedor.
- El cliente solo puede iniciar conversaciones; no puede crear una a nombre de otro.
- No se aceptan IDs de usuario desde el body.
- Los mensajes se guardan con `NVARCHAR(2000)` y soportan Unicode.
- No se implementan adjuntos (`MensajeAdjunto`) en S3; quedan para S4.

## 4. UI

- `/chat`: listado de conversaciones con proveedor, último mensaje, estado y no leídos.
- `/chat/:id`: hilo de mensajes, envío, marcar leídos y cerrar.
- Botón **Contactar proveedor** en el detalle público del vehículo.
- Polling cada 5 s; no WebSocket.

## 5. Pruebas

- `sql/tests/07_chat.sql`: crear/reutilizar, Unicode, no leídos, permisos, cierre y
  rechazo de mensajes tras cierre.
- `tests/chat.test.ts`: autenticación, roles y validación.
- `scripts/smoke-chat.ts`: cliente abre chat, proveedor responde, lectura y cierre.
