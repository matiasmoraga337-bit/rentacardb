# AGENTS.md — Proyecto RentaCarDB

Proyecto universitario de Base de Datos. Sistema web de reserva/renta de
vehículos con múltiples sedes y dueños por región de Chile.

## Contexto técnico
- Motor: Microsoft SQL Server 2022/2025 (`COMPATIBILITY_LEVEL = 160`), base `RentaCarDB`.
- Script base de referencia: `Rentascript.sql` (generado por SSMS, **UTF-16 LE**).
- Los cambios se aplican mediante un **script maestro único e idempotente**
  (ver `sql/` cuando exista).

## Skills
Ver `docs/SKILLS.md` para las skills instaladas (`database-schema-designer`,
`sql-pro`) y su uso por fase.

## Convenciones
- Idioma de trabajo y documentación: español.
- Nombres de tablas/columnas: mantener el estilo existente
  (`ID_*`, `nombre_*`, `*_<tabla>`), no renombrar por gusto.
- Toda migración debe ser idempotente (`IF EXISTS` / guardas) y no destructiva
  sin respaldo previo.
