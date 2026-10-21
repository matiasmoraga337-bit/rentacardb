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
