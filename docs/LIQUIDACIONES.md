# Liquidaciones y comisiones (S4-E11)

El administrador genera liquidaciones por proveedor y periodo a partir de
`MovimientoFinanciero`, y las aprueba/paga. El proveedor consulta las suyas.

## Reglas

- Solo ADMIN genera, aprueba y paga.
- Una liquidación por proveedor y periodo (idempotencia por `LIQ-<proveedor>-<inicio>-<fin>`).
- No se permite solapar periodos no anulados.
- Estados: `CALCULADA → APROBADA → PAGADA`; `ANULADA` queda como estado terminal.
- Bruto suma `CARGO_RESERVA`, `CARGO_KM`, `CARGO_DANO`, `CARGO_EXTRA` y `MULTA`.
- Neto = bruto - comisión - reembolsos + ajustes.

## API

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| POST | `/api/liquidaciones` | ADMIN | Body `{ID_proveedor, periodo_inicio, periodo_fin}`. |
| GET | `/api/liquidaciones?proveedor=&estado=&page=&pageSize=` | PROVEEDOR/ADMIN | Proveedor solo las propias. |
| POST | `/api/liquidaciones/:id/aprobar` | ADMIN | `CALCULADA → APROBADA`. |
| POST | `/api/liquidaciones/:id/pagar` | ADMIN | `APROBADA → PAGADA`. |

## UI

- `/admin/liquidaciones`: formulario de generación, listado y acciones.
- `/proveedor/liquidaciones`: historial de solo lectura.
- Accesos en paneles de proveedor/admin y navegación.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `PERIODO_INVALIDO` | 400 | Fechas inválidas o invertidas. |
| `PROVEEDOR_NO_ENCONTRADO` | 404 | Proveedor inexistente. |
| `LIQUIDACION_SOLAPADA` | 409 | Periodo solapado. |
| `LIQUIDACION_NO_CALCULADA` | 409 | Aprobar algo que no está calculado. |
| `LIQUIDACION_NO_APROBADA` | 409 | Pagar algo que no está aprobado. |

## Pruebas

- SQL: `sql/tests/10_liquidaciones.sql` (7 casos).
- API: `Producción/backend/tests/liquidaciones.test.ts`.
- UI: páginas admin/proveedor.
- Smoke: pendiente en `smoke-s4`.
