# PRUEBAS DE LA BASE DE DATOS — RentaCarDB

Resultados de la suite de pruebas ejecutada sobre el script final (`RentacarFinal.sql`)
en un contenedor **SQL Server 2022** aislado (`RentaCarDB`), sin tocar la BD de demo.

- **Última ejecución:** 24-oct-2026
- **Script:** `RentacarFinal.sql` (compat 160)
- **Entorno:** contenedor `rentacardb-db-test` (puerto 14331)
- **Runner:** `sql/tests/run_tests.ps1` (reconstruye la BD y ejecuta los archivos)
- **Resultado global:** **185 PASS / 0 FAIL**

## 1. Estructura de la suite

| Archivo | Casos | Cubre |
|---|---:|---|
| `sql/tests/00_schema.sql` | 12 | Objetos, conteos, 0 `sp_`/`u_u_`, triggers/CHECK/FK habilitados, compat 160, `u_sp_ValidarIntegridad` |
| `sql/tests/01_constraints.sql` | 10 | CHECK, UNIQUE, FK, defaults (ConfiguracionGlobal, Comuna, Outbox, ErrorLog, Pago) |
| `sql/tests/02_functional.sql` | 22 | Auth, proveedores/sedes, vehículos, tarifas, publicación, búsqueda, outbox |
| `sql/tests/03_triggers_security_errorlog.sql` | 13 | Triggers de solapamiento/auditoría, permisos (`api_user`/`report_user`), ErrorLog, inyección |
| `sql/tests/04_flows.sql` | 12 | Pagos, WebPay, arriendos, multas, chat (Unicode), liquidaciones/outbox |
| `sql/tests/05_reservas_pagos.sql` | 30 | Reserva, idempotencia, solapamiento, WebPay, reutilización/doble confirmación, reembolso, expiración (cursor) y vista |
| `sql/tests/06_arriendos.sql` | 22 | Inicio de arriendo, inspección ENTREGA, contrato, conductor, devolución, cargo por km, daño DEVOLUCION, reseña y errores |
| `sql/tests/07_chat.sql` | 10 | Crear/reutilizar conversación, Unicode, no leídos, permisos, cierre y mensajes tras cierre |
| `sql/tests/08_cargos_multas.sql` | 7 | Cargo extra/multa sobre arriendo finalizado, movimiento financiero y errores de monto/arriendo |
| `sql/tests/09_disputas.sql` | 6 | Apertura, duplicado, autor ajeno, EN_REVISION, resolucion y cierre |
| `sql/tests/10_liquidaciones.sql` | 7 | Generacion, idempotencia, solapamiento, aprobacion y pago |
| `sql/tests/11_notificaciones_outbox.sql` | 8 | Notificacion leida, permisos y ciclo outbox (procesado/reintento) |
| `sql/tests/12_adjuntos_fotos.sql` | 6 | Fotos de inspeccion y adjuntos de chat con permisos |
| `sql/tests/13_catalogos.sql` | 8 | CRUD de catalogo simple, modelo, caracteristica y politica |
| `sql/tests/14_favoritos_busquedas.sql` | 9 | Favoritos y busquedas guardadas con permisos |
| `sql/tests/15_calificacion.sql` | 2 | Recalculo de promedio de calificacion del vehiculo |
| `sql/tests/16_busqueda_region.sql` | 1 | Busqueda publica filtrada por region |

## 2. Resultados por categoría

### Esquema (12/12)
- 83 tablas, 84 SPs, 6 vistas, 3 funciones, 4 triggers.
- 0 procedimientos `sp_` de usuario y 0 con doble prefijo `u_u_`.
- Triggers, CHECK y FK habilitados; compat 160; `u_sp_ValidarIntegridad` sin errores.

### Restricciones (10/10)
- `ConfiguracionGlobal` singleton y rangos de IVA/comisión.
- `Comuna`: nombre vacío (CHECK) y duplicado por provincia (UNIQUE).
- `OutboxEvento`: `ISJSON` y estado inválido.
- `ErrorLog`: `origen` inválido y default `revisado=0`.
- `Pago` con reserva inexistente (FK).

### Funcional (22/22)
- Login válido/inválido/inexistente.
- Registro: RUT duplicado, email duplicado, RUT inválido.
- Verificación de email y reset: token válido y token usado.
- Sede: nombre duplicado y comuna inexistente.
- Vehículo: patente duplicada, año 1949, precio negativo.
- Tarifa: fecha invertida y día de semana 8.
- Vehículo publicado visible en `vw_VehiculosDisponibles`.
- Cliente no puede auto-asignarse ADMIN.
- Configuración: días máximos < mínimos.
- Liquidación: período invertido.
- Outbox: publicar evento.
- Fixtures S2: `VehiculoSede` y documentos obligatorios verificados.

### Triggers, seguridad y ErrorLog (13/13)
- Solapamiento de reserva → **70900**; bloqueo → **70901**; fechas adyacentes permitidas.
- Auditoría de cambio de estado de reserva → nueva fila `STATE_CHANGE`.
- `api_user`: SELECT y EXECUTE permitidos; UPDATE directo **denegado**.
- `report_user`: UPDATE **denegado**.
- ErrorLog: login inválido → error **51130** propagado **y** fila registrada con email (sin contraseña).
- Intento de inyección en email → error, el SP sigue existiendo.

### Flujos y módulos restantes (12/12)
- Pago/WebPay/arriendo/devolución/multa con datos inexistentes → errores de negocio esperados.
- Conversación: crear, enviar mensaje con **Unicode (Ñ, áéíóú)** y cerrar.
- Liquidaciones y outbox: aprobar/pagar/reintentar inexistentes → errores esperados.

### S2 — Reservas y pagos (30/30)
- Crear reserva `PENDIENTE` con total, snapshot, historial `CREAR` y bloqueo activo.- Idempotencia: misma `idempotency_key` → una sola fila.
- Solapamiento rechazado (`70209`/`70900`); reserva adyacente permitida.
- WebPay iniciar → token de 64 caracteres; confirmar → reserva `CONFIRMADA`.
- Pago `APROBADO` y trigger de auditoría `FINANCIAL`.
- Pago sobre reserva confirmada → `52005`.
- Cancelar con reembolso → reserva `CANCELADA`, reembolso `COMPLETADO` y movimiento `REEMBOLSO` negativo.
- Reintento de cancelación con la misma clave → idempotente y un solo reembolso.
- Cancelar sin pago → `CANCELADA` sin reembolso.
- Expiración: reserva vencida → `EXPIRADA`, bloqueo liberado (cursor `u_sp_ExpirarReservas`).
- `vw_ReservasDetalle` devuelve la reserva integrada.
- Hardening: doble confirmación WebPay rechazada (`52034`).
- Hardening: iniciar WebPay sobre reserva confirmada rechazado (`52032`).
- Hardening: reembolso que excede el saldo rechazado (`70301`).
- Hardening: confirmación tras cancelar rechazada (`52035`).
- Hardening: cancelación por usuario que no es dueño rechazada (`70305`).
- Hardening: `u_sp_WebPay_IniciarTransaccion` reutiliza la transacción pendiente.
- Hardening: monto distinto al total de la reserva rechazado (`52007`).
- Hardening: confirmación de reserva expirada rechazada (`52037`).
- Hardening: historial `CONFIRMAR` creado por WebPay.

### S3 — Arriendos e inspecciones (22/22)
- Reserva confirmada con política de km y pago WebPay.
- Inicio de arriendo: estado `ACTIVO`, reserva `EN_CURSO`, vehículo `ARRENDADO` e inspección `ENTREGA`.
- Contrato aceptado con hash SHA-256.
- Conductor adicional con persona y licencia verificada.
- Daño en inspección `ENTREGA` rechazado (`60063`).
- Reseña antes de finalizar rechazada (`53014`).
- Devolución: arriendo `FINALIZADO`, reserva `COMPLETADA`, vehículo `DISPONIBLE` e inspección `DEVOLUCION`.
- Cargo automático por km excedido y movimiento `CARGO_KM`.
- Notificación `ARRIENDO_FINALIZADO`.
- Daño registrado en `DEVOLUCION`.
- Reseña tras finalizar y duplicado rechazado (`53017`).
- E13 reutiliza el SP y agrega cobertura de API/UI: tres tipos de reseña y listado público.
- Devolución duplicada rechazada (`53009`).
- Inicio de arriendo sin licencia rechazado (`53014`).

### S3 — Chat (10/10)
- Crear conversación activa y reutilizarla si ya existe.
- Enviar mensaje Unicode (Ñ, áéíóú).
- Actualizar preview del último mensaje.
- Rechazar marcado de leídos y cierre por usuario ajeno (`60096`/`60094`).
- Cerrar conversación y rechazar mensajes posteriores (`60091`).
- Crear una nueva conversación activa tras cerrar la anterior.

### S4 — Cargos extra y multas (7/7)
- Cargo extra sobre arriendo `FINALIZADO` crea `CargoExtra` y `MovimientoFinanciero CARGO_EXTRA`.
- Multa sobre arriendo `FINALIZADO` crea `Multa` y `MovimientoFinanciero MULTA`.
- Monto cero rechazado (`53020`/`60040`).
- Arriendo inexistente rechazado (`53021`/`60041`).
- Los cargos extra se suman al bruto de `u_sp_GenerarLiquidacion`.

### S4 — Disputas (6/6)
- Crear disputa sobre arriendo finalizado → `ABIERTA`.
- Duplicado abierto rechazado (`60111`).
- Usuario ajeno rechazado (`60112`).
- Admin pasa a `EN_REVISION` y resuelve con fecha de cierre.
- Resolver una disputa ya cerrada rechazado (`60116`).

### S4 — Liquidaciones (7/7)
- Generar liquidacion por proveedor y periodo → `CALCULADA`.
- Segunda generacion con el mismo periodo es idempotente (una fila).
- Periodo solapado rechazado (`70504`).
- Aprobar → `APROBADA`; aprobar dos veces rechazado (`70502`).
- Pagar → `PAGADA` con fecha; pagar dos veces rechazado (`70503`).

### S4 — Notificaciones y outbox (8/8)
- Crear notificacion `PUSH` y marcarla `LEIDA` con fecha.
- Notificacion de otro usuario o ya leida rechazada (`60200`).
- Publicar evento, bloquearlo con `u_sp_ObtenerOutboxPendiente` y marcarlo `PROCESADO`.
- Reprocesar el mismo evento rechazado (`70311`).
- Reintentar un evento ya procesado rechazado (`70312`).

### S4 — Fotos y adjuntos (6/6)
- Registrar foto de inspeccion activa.
- Inspeccion inexistente rechazada (`60300`).
- Registrar adjunto de chat activo.
- Adjunto de usuario ajeno rechazado (`60303`).
- Tamano invalido rechazado (`60305`).
- Mensaje inexistente rechazado (`60302`).

### S4 — Catalogos (8/8)
- Crear/editar marca; duplicado rechazado (`60403`).
- Crear/desactivar modelo; inexistente rechazado (`60402`).
- Crear caracteristica.
- Politica con porcentaje invalido rechazada (`60406`).

### S4 — Favoritos y busquedas (8/8)
- Agregar favorito es idempotente; quitar favorito funciona.
- Vehiculo inexistente rechazado (`60501`).
- Guardar busqueda y soft delete.
- Fechas invertidas rechazadas (`60502`).
- Eliminar busqueda ajena rechazado (`60503`).

### S4 — Calificacion promedio (2/2)
- Recalculo del promedio del vehiculo a partir de resenas `CLIENTE_A_VEHICULO`.
- Arriendo inexistente rechazado (`60600`).

## 3. Defectos encontrados y corregidos durante la fase de pruebas
1. **`u_u_sp_RegistrarVehiculoFoto`** (doble prefijo). Corregido en script y backend; se agregó prueba real de subida de foto (WebP + thumb).
2. **Falso positivo** en “Registro email duplicado”: usaba el RUT del admin y fallaba por RUT. Corregido con un RUT nuevo.
3. **`QUOTED_IDENTIFIER`** en los scripts de prueba (tablas con índices filtrados). Se agregó `SET QUOTED_IDENTIFIER ON`.
4. **`REPLICATE()` inline en `EXEC`** no es válido; se asigna a variables antes de llamar al SP.
5. **Formato de patente** en el seed demo (`CK_vehiculo_patente_formato`). Se corrigió a 4 letras + 2 dígitos (`DEMA01`, `DEMB02`).
6. **Recordsets múltiples** en `u_sp_CrearReserva`/`u_sp_CancelarReserva` (snapshot/reembolso/reserva/vista). El repositorio selecciona explícitamente la fila de `vw_ReservasDetalle`.
7. **Doble confirmación WebPay** y reanimación de reservas canceladas/expiradas. Se endureció `u_sp_WebPay_ConfirmarTransaccion` con `UPDLOCK/HOLDLOCK`, validación de estado y `UPDATE` condicional; migración en `sql/migrations/2026-10-21_s2_webpay_hardening.sql`.
8. **Fechas imposibles** (`2026-02-31`) llegaban a SQL como error 241. Se agregó validación de calendario en zod/servicios y mapeo a 400.
9. **Reembolsos manuales de CLIENTE**. Las rutas `/reembolsos` y `/reembolsos/:id/completar` quedaron solo para ADMIN; el cliente usa `POST /reservas/:id/cancelar`.
10. **RUT del fixture S3**: `21000000-K` no superaba `fn_ValidarRut`; se corrigió a `21000000-3`.
11. **Sede actual del vehículo** en el smoke S3: el retiro debe usar la sede donde está el vehículo. El checkout y el smoke ahora preseleccionan `idSedeActual`.

## 4. Cobertura no incluida (pendiente / futura)
- Liquidaciones y reportes financieros finales (S4).
- Concurrencia real con dos sesiones SQL (la carrera WebPay se prueba vía smoke API con `Promise.all`).
- Rendimiento (`SET STATISTICS IO/TIME`) en búsqueda y reportes.
- Cobertura exhaustiva de los 94 CHECK (se probaron los representativos).

## 5. Cómo ejecutar

```powershell
# Requiere Docker y el contenedor rentacardb-db-test
powershell -ExecutionPolicy Bypass -File sql/tests/run_tests.ps1
```

El runner:
1. Reconstruye `RentaCarDB` desde `RentacarFinal.sql`.
2. Ejecuta los archivos `00`–`05` en orden.
3. Guarda los logs en `sql/tests/results/` (ignorado por git).
4. Devuelve código de salida 1 si hay algún `FAIL`.

## 6. Recomendaciones
- Agregar un job de **CI con SQL Server 2022** que ejecute `sql/tests/` en cada PR.
- Añadir el test de concurrencia con dos conexiones y el de rendimiento.
- Para la demo, ejecutar `npm run seed` y `npm run smoke:s2` después de la suite.
