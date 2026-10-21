# MODELO DE DATOS

La aplicación web consume la base de datos **`RentaCarDB`**, documentada en la carpeta
hermana [`../../docs/`](../../docs/).

## Documentos del modelo (referencia)

| Documento | Contenido |
|---|---|
| [`../../docs/01-ModeloRelacional.md`](../../docs/01-ModeloRelacional.md) | Diccionario de datos (82 tablas). |
| [`../../docs/02-Relaciones.md`](../../docs/02-Relaciones.md) | Relaciones y cardinalidades. |
| [`../../docs/03-Normalizacion-3FN.md`](../../docs/03-Normalizacion-3FN.md) | Normalización. |
| [`../../docs/04-Clasificacion-Tablas.md`](../../docs/04-Clasificacion-Tablas.md) | Clasificación de tablas. |
| [`../../docs/05-Alcance.md`](../../docs/05-Alcance.md) | Alcance. |
| [`../../docs/06-ERD.md`](../../docs/06-ERD.md) | Diagramas ERD. |

## Script de la base

- **Final:** [`../../RentacarFinal.sql`](../../RentacarFinal.sql) — crea el esquema, catálogos y permisos.
- **Copia para el contenedor:** `database/RentacarFinal.sql` (con `COMPATIBILITY_LEVEL` ajustado a la imagen Docker).
- **Datos de ejemplo:** `database/seed-demo.sql` (a crear en S2).

## Puntos de integración clave

- La app se conecta con **`api_user`** (rol `db_rentacar_rw`): **solo `EXECUTE`/`SELECT`**.
- La escritura se hace **por SPs** (ver [`API.md`](API.md) para el mapeo endpoint → SP).
- **Idempotencia** y **correlación** se propagan a los SPs que las soportan.
- Vistas de lectura ya disponibles: `vw_VehiculosPublicados`, `vw_ReservasDetalle`,
  `vw_VehiculosDisponibles`, `vw_PagosPendientes`, `vw_DocumentosVencidos`,
  `vw_MantenimientosActivos`.

## Reglas de negocio que ya viven en la BD (no reimplementar en la API)

- Cálculo de precio (`fn_PrecioAplicable`), comisión (`fn_ComisionAplicable`), IVA (`ConfiguracionGlobal`).
- Validación de solapamiento de reservas (trigger + SP).
- Transiciones de estado de reserva (`TransicionEstadoReserva`).
- Reembolsos, liquidaciones, comisiones y movimientos financieros.
- Auditoría (triggers) y outbox de eventos.
