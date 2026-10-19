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

- Nombres: `describe('sp_V5_CrearReserva')`, `it('rechaza solapamiento')`.
- Mocks de BD solo cuando sea imprescindible; preferir BD real de test.
- No probar los SPs (ya están validados en la BD); probar **cómo los usa la API**.

## 5) Definición de "testeado"

Una historia está testeada cuando: sus endpoints/componentes tienen tests que pasan en CI y
el flujo crítico asociado está cubierto por al menos un test de integración o API.
