# TESTING

Estrategia de pruebas de la aplicación web (pirámide de tests).

## 1) Niveles

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| **Unitario (servicios/util)** | Jest (BE) · Vitest (FE) | Lógica pura: validaciones, cálculo, formatters |
| **Integración (repos/SPs)** | Jest + BD de prueba | Repositorios contra una BD con datos conocidos |
| **API (endpoint)** | Jest + Supertest | Contratos REST, auth, códigos de estado |
| **Componentes UI** | Vitest + Testing Library | Formularios, tablas, estados de carga/error |
| **e2e (opcional)** | Playwright | Flujo reserva → pago → devolución |

## 2) Flujos críticos a probar (obligatorio)

1. **Registro → login → verificación.**
2. **Crear reserva** (validación de solapamiento, cálculo de total).
3. **Pago** (registro + Webpay simulado: iniciar/confirmar).
4. **Devolución** (cálculo de km excedidos, cargo extra, comisión).
5. **Cancelación + reembolso.**
6. **Autorización** (un cliente no puede ver/editar recursos ajenos).

## 3) Criterios

- **Cobertura objetivo:** ≥ 70% en `services` y `repositories`.
- Cada **endpoint nuevo** con al menos un test feliz y uno de error.
- Los tests corren en **CI** en cada PR.
- Datos de prueba **aislados** (transacción con rollback o BD efímera).

## 4) Convenciones

- Nombres: `describe('u_sp_CrearReserva')`, `it('rechaza solapamiento')`.
- Mocks de BD solo cuando sea imprescindible; preferir BD real de test.
- No probar los SPs (ya están validados en la BD); probar **cómo los usa la API**.

## 5) Definición de "testeado"

Una historia está testeada cuando: sus endpoints/componentes tienen tests que pasan en CI y
el flujo crítico asociado está cubierto por al menos un test de integración o API.

## 6) Sprint S2 — Reservas y pagos

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/05_reservas_pagos.sql` | Crear reserva, snapshot, bloqueo, idempotencia, solapamiento, WebPay, reutilización/doble confirmación, reembolso, expiración con cursor y `vw_ReservasDetalle` (30 casos). |
| Backend (API) | `Producción/backend/tests/reservas.test.ts` | Autenticación, validación de fechas, autorización y cancelación ADMIN. |
| Backend (API) | `Producción/backend/tests/pagos.test.ts` | `/pagos` solo ADMIN, validación WebPay, reembolsos solo ADMIN y reportes. |
| Backend (unitario) | `Producción/backend/tests/reembolso-policy.test.ts` | Cálculo de reembolso: 100%, 50%, 0%, anticipación y saldo. |
| Frontend | `Producción/frontend/src/features/reservas/__tests__/` | Formatos, badges y tabla de reservas. |
| Smoke e2e | `Producción/backend/scripts/smoke-s2.ts` | Login → buscar → reservar → pagar → cancelar + doble confirmación concurrente contra API + BD. |

Comandos:

```powershell
# BD (contenedor rentacardb-db-test)
powershell -ExecutionPolicy Bypass -File sql/tests/run_tests.ps1

# Backend
cd Producción/backend
npm run lint; npm run typecheck; npm test; npm run build

# Frontend
cd Producción/frontend
npm run lint; npm run typecheck; npm test; npm run build

# Smoke S2 (API + BD levantadas)
cd Producción/backend
npm run smoke:s2
```

## 7) Sprint S3 — Arriendos e inspecciones

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/06_arriendos.sql` | Inicio de arriendo, inspección ENTREGA, contrato, conductor, devolución, cargo por km, daño DEVOLUCION, reseña y errores (22 casos). |
| Backend (API) | `Producción/backend/tests/arriendos.test.ts` | Autenticación, roles, validación de inicio/devolución/daños/contrato/conductores. |
| Frontend | `Producción/frontend/src/features/arriendos/__tests__/` | Badge de estado y tabla de arriendos. |
| Smoke e2e | `Producción/backend/scripts/smoke-s3.ts` | Login → reserva con km → pago → inicio → contrato → conductor → devolución → daño. |

```powershell
cd Producción/backend
npm run smoke:s3
```

## 8) Sprint S3 — Chat

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/07_chat.sql` | Crear/reutilizar conversación, Unicode, no leídos, permisos, cierre y mensajes tras cierre (10 casos). |
| Backend (API) | `Producción/backend/tests/chat.test.ts` | Autenticación, roles y validación de mensajes. |
| Smoke e2e | `Producción/backend/scripts/smoke-chat.ts` | Cliente abre chat, proveedor responde, lectura y cierre. |

```powershell
cd Producción/backend
npm run smoke:chat
```

## 9) Sprint S3 — Resenas

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/06_arriendos.sql` | Creacion de resena tras finalizar, rechazo antes de finalizar y duplicado. |
| Backend (API) | `Producción/backend/tests/resenas.test.ts` | Autenticacion, validacion de calificacion, tipo, comentario y listado publico. |
| Frontend | `Producción/frontend/src/features/resenas/__tests__/ResenaForm.test.tsx` | Seleccion de estrellas y envio de la resena. |
| Smoke e2e | `Producción/backend/scripts/smoke-s3.ts` | Resenas cliente→vehiculo/proveedor, proveedor→cliente y listado publico. |

```powershell
cd Producción/backend
npm run smoke:s3
```

## 10) Sprint S3 — Paneles

| Capa | Archivo | Qué cubre |
|---|---|---|
| Backend (API) | `Producción/backend/tests/admin.test.ts` | Autenticacion y rol ADMIN en `GET /admin/auditoria`. |
| Frontend | `Producción/frontend/src/features/paneles/__tests__/MetricCard.test.tsx` | Tarjeta de metrica reutilizable. |
| UI | `/panel`, `/admin/catalogos`, `/admin/auditoria` | Widgets por rol, consulta de catalogos y auditoria paginada. |

## 11) Sprint S4 — Cargos extra y multas

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/08_cargos_multas.sql` | Cargo y multa sobre arriendo finalizado, movimientos financieros y errores (7 casos). |
| Backend (API) | `Producción/backend/tests/arriendos.test.ts` | Auth, rol, validación de monto y fecha. |
| Frontend | `Producción/frontend/src/features/arriendos/__tests__/CargoForm.test.tsx` | Envío de concepto, tipo y monto. |
| Smoke e2e | `Producción/backend/scripts/smoke-s3.ts` | Cargo y multa tras la devolución. |

## 12) Sprint S4 — Disputas

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/09_disputas.sql` | Apertura, duplicado, autor ajeno, revision, resolucion y cierre (6 casos). |
| Backend (API) | `Producción/backend/tests/disputas.test.ts` | Auth, validacion, filtros y rol ADMIN. |
| Frontend | `/disputas`, `/admin/disputas`, `DisputaForm` | Listado por rol, apertura y resolucion. |

## 13) Sprint S4 — Liquidaciones

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/10_liquidaciones.sql` | Generacion, idempotencia, solapamiento, aprobacion y pago (7 casos). |
| Backend (API) | `Producción/backend/tests/liquidaciones.test.ts` | Auth, roles y validacion de periodo/filtros. |
| UI | `/admin/liquidaciones`, `/proveedor/liquidaciones` | Generacion, aprobacion, pago y consulta. |

## 14) Sprint S4 — Notificaciones y outbox

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/11_notificaciones_outbox.sql` | Notificacion LEIDA, permisos y ciclo del outbox (8 casos). |
| Backend (API) | `Producción/backend/tests/notificaciones.test.ts` | Auth, filtros, lectura y outbox admin. |
| Frontend | `Producción/frontend/src/features/notificaciones/__tests__/NotificationBell.test.tsx` | Contador de no leidas. |
| Worker | `Producción/backend/src/jobs/outbox.job.ts` | Procesa pendientes, envia correo y marca resultado. |

## 15) Sprint S4 — Fotos y adjuntos

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/12_adjuntos_fotos.sql` | Foto de inspeccion, adjunto de chat, permisos y tamano (6 casos). |
| Backend | `Producción/backend/tests/arriendos.test.ts`, `chat.test.ts` | Validacion base de endpoints. |
| UI | `InspeccionFotos`, formulario de adjuntos en chat | Subida y visualizacion. |

## 16) Sprint S4 — Catalogos

| Capa | Archivo | Qué cubre |
|---|---|---|
| BD | `sql/tests/13_catalogos.sql` | CRUD simple, modelo, caracteristica, politica y errores (8 casos). |
| Backend (API) | `Producción/backend/tests/catalogos.test.ts` | Auth, rol ADMIN, validacion y solo lectura. |
| UI | `Producción/frontend/src/features/admin/AdminCatalogosPage.tsx` | Alta, edicion y desactivacion por catalogo. |