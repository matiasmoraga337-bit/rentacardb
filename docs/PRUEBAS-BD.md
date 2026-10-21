# PRUEBAS DE LA BASE DE DATOS — RentaCarDB

Resultados de la suite de pruebas ejecutada sobre el script final (`RentacarFinal.sql`)
en un contenedor **SQL Server 2022** aislado (`RentaCarDB`), sin tocar la BD de demo.

- **Última ejecución:** 21-oct-2026
- **Script:** `RentacarFinal.sql` (compat 160)
- **Entorno:** contenedor `rentacardb-db-test` (puerto 14331)
- **Runner:** `sql/tests/run_tests.ps1` (reconstruye la BD y ejecuta los archivos)
- **Resultado global:** **88 PASS / 0 FAIL**

## 1. Estructura de la suite

| Archivo | Casos | Cubre |
|---|---:|---|
| `sql/tests/00_schema.sql` | 12 | Objetos, conteos, 0 `sp_`/`u_u_`, triggers/CHECK/FK habilitados, compat 160, `u_sp_ValidarIntegridad` |
| `sql/tests/01_constraints.sql` | 10 | CHECK, UNIQUE, FK, defaults (ConfiguracionGlobal, Comuna, Outbox, ErrorLog, Pago) |
| `sql/tests/02_functional.sql` | 22 | Auth, proveedores/sedes, vehículos, tarifas, publicación, búsqueda, outbox |
| `sql/tests/03_triggers_security_errorlog.sql` | 13 | Triggers de solapamiento/auditoría, permisos (`api_user`/`report_user`), ErrorLog, inyección |
| `sql/tests/04_flows.sql` | 12 | Pagos, WebPay, arriendos, multas, chat (Unicode), liquidaciones/outbox |
| `sql/tests/05_reservas_pagos.sql` | 19 | Reserva, idempotencia, solapamiento, WebPay, reembolso, expiración (cursor) y vista |

## 2. Resultados por categoría

### Esquema (12/12)
- 83 tablas, 69 SPs, 6 vistas, 3 funciones, 4 triggers.
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

### S2 — Reservas y pagos (19/19)
- Crear reserva `PENDIENTE` con total, snapshot, historial `CREAR` y bloqueo activo.
- Idempotencia: misma `idempotency_key` → una sola fila.
- Solapamiento rechazado (`70209`/`70900`); reserva adyacente permitida.
- WebPay iniciar → token de 64 caracteres; confirmar → reserva `CONFIRMADA`.
- Pago `APROBADO` y trigger de auditoría `FINANCIAL`.
- Pago duplicado sobre reserva confirmada → `52005`.
- Cancelar con reembolso → reserva `CANCELADA`, reembolso `COMPLETADO` y movimiento `REEMBOLSO` negativo.
- Reintento de cancelación con la misma clave → idempotente y un solo reembolso.
- Cancelar sin pago → `CANCELADA` sin reembolso.
- Expiración: reserva vencida → `EXPIRADA`, bloqueo liberado (cursor `u_sp_ExpirarReservas`).
- `vw_ReservasDetalle` devuelve la reserva integrada.

## 3. Defectos encontrados y corregidos durante la fase de pruebas
1. **`u_u_sp_RegistrarVehiculoFoto`** (doble prefijo). Corregido en script y backend; se agregó prueba real de subida de foto (WebP + thumb).
2. **Falso positivo** en “Registro email duplicado”: usaba el RUT del admin y fallaba por RUT. Corregido con un RUT nuevo.
3. **`QUOTED_IDENTIFIER`** en los scripts de prueba (tablas con índices filtrados). Se agregó `SET QUOTED_IDENTIFIER ON`.
4. **`REPLICATE()` inline en `EXEC`** no es válido; se asigna a variables antes de llamar al SP.
5. **Formato de patente** en el seed demo (`CK_vehiculo_patente_formato`). Se corrigió a 4 letras + 2 dígitos (`DEMA01`, `DEMB02`).
6. **Recordsets múltiples** en `u_sp_CrearReserva`/`u_sp_CancelarReserva` (snapshot/reembolso/reserva/vista). El repositorio selecciona explícitamente la fila de `vw_ReservasDetalle`.

## 4. Cobertura no incluida (pendiente / futura)
- Flujo feliz de arriendo → devolución → liquidación (S3/S4).
- Concurrencia real con dos sesiones simultáneas.
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
