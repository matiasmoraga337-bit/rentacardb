# Paneles por rol (S3-E14)

El panel principal (`/panel`) se adapta a los roles del usuario autenticado. Cada
bloque reutiliza endpoints existentes y muestra metricas, actividad reciente y
accesos rapidos.

## Cliente

- Reservas totales, confirmadas y alquileres.
- Mensajes sin leer.
- Ultimas 5 reservas con estado de reserva y de pago.
- Ultimas conversaciones con proveedores.

## Proveedor

- Vehiculos registrados, reservas confirmadas, arriendos activos y mensajes sin leer.
- Estado del proveedor y ultimas reservas/arriendos.
- Accesos a vehiculos, configuracion, sedes y chat.
- Liquidaciones queda marcado como pendiente para S4.

## Administracion

- Proveedores totales y pendientes de aprobacion.
- Reservas, alquileres y comisiones del anio.
- Ultimas reservas de la plataforma y proveedores pendientes.
- Accesos a proveedores, reportes, catalogos y auditoria.

## Auditoria

`GET /admin/auditoria?entidad=&page=&pageSize=` lista eventos de `Auditoria` con
paginacion y filtro por entidad. Solo ADMIN.

## Catalogos

`/admin/catalogos` permite consultar los catalogos maestros activos usando
`GET /catalogos/:tipo`. La edicion administrativa queda para S4.

## Pruebas

- Backend: `Producción/backend/tests/admin.test.ts` (auth/rol de auditoria).
- Frontend: `Producción/frontend/src/features/paneles/__tests__/MetricCard.test.tsx`.
