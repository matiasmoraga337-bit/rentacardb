# Objetos SQL integrados

Matriz de trazabilidad entre objetos SQL y su uso real en la aplicación.

## Integrados en Fase 1

| Objeto | Tipo | Uso en la aplicación | Evidencia |
|---|---|---|---|
| `vw_VehiculosPublicados` | Vista | Métrica y listado de flota publicada en el panel admin. | `GET /api/admin/vehiculos-publicados`, `PanelAdmin`. |
| `vw_PagosPendientes` | Vista | Métrica y listado de pagos pendientes en el panel admin. | `GET /api/admin/pagos-pendientes`, `PanelAdmin`. |
| `vw_DocumentosVencidos` | Vista | Alerta de documentos próximos a vencer para el proveedor. | `GET /api/proveedores/documentos-vencidos`, `PanelProveedor`. |
| `u_sp_ReporteLiquidaciones` | SP | Pestaña de liquidaciones en reportes admin. | `GET /api/reportes/liquidaciones`. |
| `u_sp_ReporteProveedores` | SP | Pestaña de actividad por proveedor. | `GET /api/reportes/proveedores`. |
| `u_sp_ReporteTiposProveedor` | SP | Pestaña de proveedores por tipo. | `GET /api/reportes/tipos-proveedor`. |
| `u_sp_ValidarIntegridad` | SP | Pestaña de salud de datos. | `GET /api/reportes/integridad`. |
| `u_sp_MarcarNotificacionEnviada` | SP | Worker outbox: marca notificación enviada o fallida. | `outbox.job.ts`, `notificacion.repository.ts`. |
| `u_sp_PublicarEvento` | SP | Evento `ReservaCreada` al crear una reserva. | `u_sp_CrearReserva`. |
| `vw_MantenimientosActivos` | Vista | Mantenimiento activo en el detalle del vehículo. | `GET /api/vehiculos/:id/mantenimientos`. |
| `u_sp_RegistrarMantenimiento` | SP | Inicio de mantenimiento desde el detalle del vehículo. | `POST /api/vehiculos/:id/mantenimientos`. |
| `u_sp_FinalizarMantenimiento` | SP | Cierre de mantenimiento y vuelta a disponible. | `POST /api/vehiculos/:id/mantenimientos/:id/finalizar`. |

## Pendientes de integrar

| Objeto | Tipo | Integración planificada |
|---|---|---|
| `u_sp_RegistrarLicenciaConducir` | SP | Registro de licencia en el perfil del cliente. |
| `u_sp_LiberarDeposito` | SP | Liberación automática al cancelar/finalizar la reserva. |

## Pruebas

- SQL: `sql/tests/17_integracion_objetos.sql`.
- API: `Producción/backend/tests/objetos-sql.test.ts` (auth y roles).
- E2E: panel admin y alertas del proveedor.
