# Cargos extra y multas (S4-E10.1/E10.2)

Permiten que el proveedor/operador agregue cargos y multas a un arriendo ya
finalizado. Ambos generan movimientos financieros para que las liquidaciones los
consideren.

## Reglas

- Solo arriendo en estado `FINALIZADO`.
- Roles: `PROVEEDOR`, `OPERADOR`, `ADMIN` con acceso al arriendo.
- Monto mayor que cero; concepto/descripción obligatorios.
- `CargoExtra` usa un tipo del catálogo (`COMBUSTIBLE`, `KM_EXCEDIDO`, `DANO`,
  `LIMPIEZA`, `MULTA_TRANSITO`, `OTRO`).
- Movimientos:
  - cargo extra → `MovimientoFinanciero.tipo_movimiento = 'CARGO_EXTRA'`.
  - multa → `MovimientoFinanciero.tipo_movimiento = 'MULTA'`.
- `u_sp_GenerarLiquidacion` suma `CARGO_EXTRA` al bruto.

## API

| Metodo | Ruta | Acceso | Body |
|---|---|---|---|
| POST | `/api/arriendos/:id/cargos-extra` | PROVEEDOR/OPERADOR/ADMIN | `{concepto, monto, tipo_cargo?, observaciones?}` |
| POST | `/api/arriendos/:id/multas` | PROVEEDOR/OPERADOR/ADMIN | `{fecha_multa, descripcion, monto, organismo?, numero_parte?}` |

`GET /api/arriendos/:id` devuelve `cargos[]` y `multas[]`.

## UI

- `CargoForm` y `MultaForm` aparecen en `ArriendoDetallePage` cuando el arriendo
  está `FINALIZADO` y el usuario es operador/proveedor/admin.
- El detalle muestra las multas junto a los cargos extra.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `MONTO_INVALIDO` | 400 | Monto menor o igual a cero. |
| `ARRIENDO_NO_FINALIZADO` | 409 | Arriendo inexistente o no finalizado. |
| `FECHA_INVALIDA` | 400 | Fecha de multa fuera del calendario. |
| `ARRIENDO_NO_ENCONTRADO` | 404 | Arriendo inexistente al crear cargo. |

## Pruebas

- SQL: `sql/tests/08_cargos_multas.sql` (7 casos).
- API: `Producción/backend/tests/arriendos.test.ts`.
- UI: `Producción/frontend/src/features/arriendos/__tests__/CargoForm.test.tsx`.
- Smoke: `npm run smoke:s3` incluye cargo y multa.
