# Documentación — RentaCarDB

Proyecto universitario de Base de Datos: sistema web de reserva/renta de vehículos
con múltiples sedes y dueños por región de Chile.

- **Motor:** Microsoft SQL Server 2022 (`COMPATIBILITY_LEVEL = 160`)
- **Base de datos:** `RentaCarDB`
- **Script de creación (final):** `RentacarFinal.sql` — autosuficiente (crea la base, guarda `IF DB_ID(...) IS NULL`, triggers, permisos de esquema y opciones saneadas).
- Complementos/auxiliares: `estesiscript.sql`, `sql/01_completar_export.sql`, `sql/02_reconciliar_triggers_permisos.sql`.
- **Conteo:** 83 tablas · 113 claves foráneas · 54 restricciones `UNIQUE` · 93 `CHECK` · 111 índices · 4 triggers · 71 procedimientos almacenados · 3 funciones · 6 vistas.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| — | [`GLOSSARY.md`](GLOSSARY.md) | Glosario de términos del dominio. |
| 1 | [`01-ModeloRelacional.md`](01-ModeloRelacional.md) | Diccionario de datos (núcleo detallado + catálogos resumidos). |
| 2 | [`02-Relaciones.md`](02-Relaciones.md) | Relaciones y cardinalidades (`#` 1 · `∞` muchos). |
| 3 | [`03-Normalizacion-3FN.md`](03-Normalizacion-3FN.md) | Justificación de 1FN/2FN/3FN y desnormalizaciones controladas. |
| 4 | [`04-Clasificacion-Tablas.md`](04-Clasificacion-Tablas.md) | Maestras / Transaccionales / Asociativas / Técnicas. |
| 5 | [`05-Alcance.md`](05-Alcance.md) | Alcance, supuestos y límites del proyecto. |
| 6 | [`06-ERD.md`](06-ERD.md) | Diagramas entidad‑relación por módulo (Mermaid) + pasos para SSMS. |
| — | [`RESERVAS-PAGOS.md`](RESERVAS-PAGOS.md) | S2: flujo, endpoints, SQL, idempotencia y seguridad de reservas/pagos. |
| — | [`ARRIENDOS.md`](ARRIENDOS.md) | S3: arriendos, inspecciones, devolución, contrato y daños. |
| — | [`CHAT.md`](CHAT.md) | S3: chat cliente-proveedor y reglas de mensajería. |
| — | [`RESENAS.md`](RESENAS.md) | S3: reseñas de arriendo, reglas y listado público. |
| — | [`PANELES.md`](PANELES.md) | S3: paneles por rol, catálogos y auditoría. |
| — | [`CARGOS-MULTAS.md`](CARGOS-MULTAS.md) | S4: cargos extra y multas sobre arriendos finalizados. |
| — | [`DISPUTAS.md`](DISPUTAS.md) | S4: apertura, listado y resolución de disputas. |
| — | [`LIQUIDACIONES.md`](LIQUIDACIONES.md) | S4: generación, aprobación, pago y consulta de liquidaciones. |
| — | [`JUSTIFICACION-TRIGGERS-CURSOR.md`](JUSTIFICACION-TRIGGERS-CURSOR.md) | Justificación de los 4 triggers y del cursor de expiración. |
| — | [`DEMO-S2.md`](DEMO-S2.md) | Guion reproducible de la demo H2. |
| — | [`DEMO-S3.md`](DEMO-S3.md) | Guion reproducible de arriendos e inspecciones. |
| — | [`PRUEBAS-BD.md`](PRUEBAS-BD.md) | Resultados de la suite SQL (151 PASS). |
| — | [`Informe-BD.md`](Informe-BD.md) | Documento consolidado (todos los anteriores en uno). |

## Convenciones de nombres
- Clave primaria: `ID_<entidad>` (ej. `ID_reserva`).
- Clave foránea: `ID_<referencia>_<tabla>` (ej. `ID_vehiculo_reserva` = FK a `Vehiculo` desde `Reserva`).
- Restricciones: `PK_*`, `FK_*`, `UQ_*`, `CK_*`, `DF_*`.
- Booleanos: `bit` (1/0). Fechas: `date` (día) / `datetime2(0)` (instante). Montos: `decimal`.
