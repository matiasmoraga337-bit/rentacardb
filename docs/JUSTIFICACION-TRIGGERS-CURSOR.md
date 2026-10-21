# Justificación de triggers y cursor — RentaCarDB

Documento de defensa técnica para el avance y la entrega final. Explica qué
reglas viven en triggers, por qué no se resolvieron solo en la aplicación y
cuándo se justifica el cursor de expiración de reservas.

## 1. Triggers implementados

La base `RentaCarDB` tiene 4 triggers habilitados:

| Trigger | Tabla / evento | Regla | Error |
|---|---|---|---|
| `trg_Reserva_SinSolape` | `Reserva` `AFTER INSERT, UPDATE` | Un vehículo no puede tener dos reservas activas (`PENDIENTE`, `CONFIRMADA`, `EN_CURSO`) con rangos de fechas solapados. | `70900` |
| `trg_BloqueoVehiculo_SinSolape` | `BloqueoVehiculo` `AFTER INSERT, UPDATE` | Un vehículo no puede tener dos bloqueos activos solapados. | `70901` |
| `trg_Pago_AfterInsert_Auditoria` | `Pago` `AFTER INSERT` | Todo pago insertado deja una fila `FINANCIAL` en `Auditoria`. | — |
| `trg_Reserva_AfterUpdate_Auditoria` | `Reserva` `AFTER UPDATE` | Todo cambio de `ID_estado_reserva_reserva` deja una fila `STATE_CHANGE` con estado anterior, nuevo, `correlation_id` y motivo. | — |

### 1.1 Por qué el solapamiento va en un trigger

El SP `u_sp_CrearReserva` ya valida solapamientos con `UPDLOCK/HOLDLOCK`, pero
la regla es una **invariante del modelo**, no un detalle de un endpoint. Si
mañana se crea una reserva desde otro SP, un job, una migración o una consola
administrativa, el trigger sigue protegiendo la integridad. Además, la
validación de la aplicación puede quedar desactualizada si cambian las reglas.

Los triggers usan `inserted` y `EXISTS` contra la tabla completa: son
**set-based**, no recorren fila a fila. No reemplazan la validación del SP;
la complementan en la capa de datos.

### 1.2 Por qué la auditoría va en un trigger

La auditoría financiera y de estados es transversal a la aplicación. Si se
registrara solo en el servicio, cualquier llamada directa a un SP
(`u_sp_RegistrarPago`, `u_sp_WebPay_ConfirmarTransaccion`) o un cambio
administrativo podría omitirla. El trigger:

- captura el usuario desde `SESSION_CONTEXT(N'usuario_id')`;
- conserva `correlation_id` y `motivo`;
- deja evidencia incluso si la API cambia o falla;
- evita duplicar la lógica en cada endpoint.

### 1.3 Alternativa considerada

Para el solapamiento se evaluó validar solo en la API. Se descartó porque dos
peticiones concurrentes podrían pasar la validación y luego insertar filas
solapadas. La combinación SP (`UPDLOCK/HOLDLOCK`) + trigger cubre tanto la
carrera como el acceso directo.

Para la auditoría se evaluó un patrón outbox exclusivo. Se descartó como
único mecanismo porque la auditoría debe quedar **inmediata y consultable**;
el outbox se usa además para eventos de negocio (`ReservaCreada`,
`ReservaConfirmada`, `ReembolsoSolicitado`), no como sustituto de `Auditoria`.

## 2. Cursor de expiración de reservas

`u_sp_ExpirarReservas` recorre las reservas `PENDIENTE` cuya
`fecha_expiracion_reserva <= SYSDATETIME()` y, para cada una, llama a
`u_sp_CambiarEstadoReserva` con estado `EXPIRADA`, evento `EXPIRAR` y motivo
`Expiración automática`.

El cursor es `LOCAL FAST_FORWARD`, de solo lectura, y cada iteración:

1. abre su propia transacción dentro de `u_sp_CambiarEstadoReserva`;
2. valida la transición `PENDIENTE → EXPIRADA`;
3. actualiza el estado y cierra el `BloqueoVehiculo` asociado;
4. registra `HistorialEstadoReserva`, `Auditoria` (trigger) y `OutboxEvento`;
5. captura errores por fila y los registra en `ErrorLog` con origen `JOB`.

### 2.1 Por qué se justifica un cursor

No es un cursor para “recorrer una tabla porque sí”. La expiración es una
**orquestación por reserva** con efectos secundarios independientes:
transición de estado, cierre de bloqueo, historial, auditoría y evento de
outbox. Un error en una reserva no debe revertir la expiración de las demás.
El cursor permite:

- aislar el fallo por fila y registrar `ID_reserva` en `ErrorLog`;
- reutilizar el SP de transición y sus validaciones;
- mantener el orden y el contexto de auditoría de cada operación.

### 2.2 Alternativa set-based

La alternativa sería un `UPDATE` masivo de `Reserva` más inserts set-based en
historial/auditoría/outbox. Sería más rápido para lotes grandes, pero:

- duplicaría en SQL la lógica de transiciones y de cierre de bloqueos;
- perdería el aislamiento de errores por reserva;
- haría más difícil registrar el contexto de cada transición;
- podría saltarse validaciones que hoy están encapsuladas en el SP.

Si en el futuro el volumen crece y las reglas se simplifican, el reemplazo
correcto sería un proceso set-based por lotes con una tabla de trabajo y
manejo de errores conjuntos. Para el volumen y la lógica actual, el cursor es
la opción adecuada y está documentado como decisión consciente.

### 2.3 Integración en S2

- El job está en `src/jobs/reservas.job.ts` y se activa con
  `RESERVAS_JOB_ENABLED=true`.
- También existe `POST /api/admin/reservas/expirar` para ejecución manual.
- La suite `sql/tests/05_reservas_pagos.sql` fuerza una reserva vencida y
  verifica que el cursor la deje en `EXPIRADA` y libere el bloqueo.
- El trigger de solapamiento se ejercita en la misma suite y en el smoke S2
  (segunda reserva solapada → `409 RESERVA_SOLAPADA`).
