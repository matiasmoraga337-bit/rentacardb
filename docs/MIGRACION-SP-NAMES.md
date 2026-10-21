# Migración de nombres — RentaCarDB (script final)

Refactor del script canónico `RentacarFinal.sql` para SQL Server 2022.
Esta primera fase cubre **SPs, vistas, funciones, constraints/índices y limpieza de comentarios**.
Las columnas (Regla 2) y `ErrorLog` (Regla 5) se documentan en fases posteriores.

## 1) Stored procedures renombrados (`sp_* → u_sp_*`)

### Familia WebPay
| Antes | Después |
|---|---|
| `sp_WP_IniciarTransaccion` | `u_sp_WebPay_IniciarTransaccion` |
| `sp_WP_ConfirmarTransaccion` | `u_sp_WebPay_ConfirmarTransaccion` |

### Sin versión
`sp_AprobarProveedor`, `sp_CerrarConversacion`, `sp_ConfirmarResetPassword`, `sp_CrearCargoExtra`,
`sp_CrearConversacion`, `sp_CrearResena`, `sp_EnviarMensaje`, `sp_FinalizarMantenimiento`,
`sp_IniciarArriendo`, `sp_ListarConversaciones`, `sp_ListarMensajes`, `sp_Login`,
`sp_MarcarMensajesLeidos`, `sp_MarcarNotificacionEnviada`, `sp_PublicarVehiculo`,
`sp_RegistrarConductorAdicional`, `sp_RegistrarDanoInspeccion`, `sp_RegistrarDevolucion`,
`sp_RegistrarDocumentoVehiculo`, `sp_RegistrarLicenciaConducir`, `sp_RegistrarMantenimiento`,
`sp_RegistrarMulta`, `sp_RegistrarNotificacion`, `sp_RegistrarPago`, `sp_RegistrarProveedor`,
`sp_RegistrarUsuario`, `sp_ReporteLiquidaciones`, `sp_ReporteProveedores`,
`sp_ReporteTiposProveedor`, `sp_SolicitarResetPassword`, `sp_VerificarEmail`
→ todos pasan a `u_sp_<nombre>`.

### Con versión (`_V5`)
| Antes | Después |
|---|---|
| `sp_V5_AprobarLiquidacion` | `u_sp_AprobarLiquidacion` |
| `sp_V5_BuscarVehiculos` | `u_sp_BuscarVehiculos` |
| `sp_V5_CambiarEstadoReserva` | `u_sp_CambiarEstadoReserva` |
| `sp_V5_CancelarReserva` | `u_sp_CancelarReserva` |
| `sp_V5_CrearAceptacionContrato` | `u_sp_CrearAceptacionContrato` |
| `sp_V5_CrearReembolso` | `u_sp_CrearReembolso` |
| `sp_V5_CrearReserva` | `u_sp_CrearReserva` |
| `sp_V5_CrearSnapshotReserva` | `u_sp_CrearSnapshotReserva` |
| `sp_V5_ExpirarReservas` | `u_sp_ExpirarReservas` |
| `sp_V5_GenerarLiquidacion` | `u_sp_GenerarLiquidacion` |
| `sp_V5_LiberarDeposito` | `u_sp_LiberarDeposito` |
| `sp_V5_MarcarEventoProcesado` | `u_sp_MarcarEventoProcesado` |
| `sp_V5_MarcarLiquidacionPagada` | `u_sp_MarcarLiquidacionPagada` |
| `sp_V5_MarcarReembolsoCompletado` | `u_sp_MarcarReembolsoCompletado` |
| `sp_V5_ObtenerOutboxPendiente` | `u_sp_ObtenerOutboxPendiente` |
| `sp_V5_PublicarEvento` | `u_sp_PublicarEvento` |
| `sp_V5_ReintentarOutboxError` | `u_sp_ReintentarOutboxError` |
| `sp_V5_ReporteIngresosMensuales` | `u_sp_ReporteIngresosMensuales` |
| `sp_V5_ValidarIntegridad` | `u_sp_ValidarIntegridad` |

### SPs de S1 incorporados al script canónico
`sp_ActualizarPerfilUsuario`, `sp_AsignarRolUsuario`, `sp_VincularUsuarioProveedor`,
`sp_RegistrarSedeProveedor`, `sp_ActualizarSedeProveedor`, `sp_EliminarSedeProveedor`,
`sp_ActualizarConfiguracionProveedor`, `sp_RegistrarVehiculo`, `sp_ActualizarVehiculo`,
`sp_RegistrarVehiculoFoto`, `sp_EliminarVehiculoFoto`, `sp_AgregarCaracteristicaVehiculo`,
`sp_QuitarCaracteristicaVehiculo`, `sp_RegistrarTarifaVehiculo`, `sp_ActualizarTarifaVehiculo`,
`sp_EliminarTarifaVehiculo` → `u_sp_<nombre>`.

### Wrappers eliminados
| Objeto | Motivo |
|---|---|
| `sp_CrearReserva` | Solo hacía `EXEC sp_V5_CrearReserva`. Se conserva la implementación como `u_sp_CrearReserva`. |
| `sp_RegistrarDocumentoVehiculoV4` | Solo hacía `EXEC sp_RegistrarDocumentoVehiculo`. Se conserva la implementación como `u_sp_RegistrarDocumentoVehiculo`. |

## 2) Vistas y funciones
| Antes | Después |
|---|---|
| `vw_V5_VehiculosDisponibles` | `vw_VehiculosDisponibles` |
| `fn_V5_PrecioAplicable` | `fn_PrecioAplicable` |

## 3) Constraints e índices
Se eliminaron los sufijos `_v5` y `_v6` de todos los nombres (70 ocurrencias). Ejemplos:
`PK_auditoria_v6`, `PK_aceptacion_contrato_v5`, `PK_bloqueo_vehiculo_v5`,
`PK_liquidacion_proveedor_v5`, `PK_movimiento_financiero_v5`, `PK_outbox_evento_v5`,
`PK_reserva_snapshot_v5`, `PK_reembolso_v5`, `PK_tarifa_vehiculo_v5`,
`PK_transicion_estado_reserva_v5`, `UQ_transicion_estado_v5`, `DF_auditoria_fecha_v6`,
`UX_reembolso_idempotency_key_v6`, `IX_reserva_expiracion_v6`, `IX_auditoria_correlation_v6`,
`IX_auditoria_entidad_fecha_v6`, `IX_auditoria_origen_fecha_v6`, y todos los `FK_*_v5` / `CK_*_v5`.

## 4) Columnas (Regla 2)
Pendiente de la fase 2 (renombrado manual de columnas sin sufijo de entidad).
Se documentará aquí la lista `tabla.columna_antes → tabla.columna_despues`.

## 5) Comentarios
- Se eliminaron banners decorativos, etiquetas de módulo/sección, changelogs y comentarios obvios (331 líneas).
- Se conservaron los comentarios de decisión técnica: `SESSION_CONTEXT`, `UPDLOCK/HOLDLOCK`,
  idempotencia, patrón Outbox, snapshots, DENY/mínimo privilegio.
- Se agregó el bloque de convención de códigos de error (`51xxx`…`709xx`).

## 6) Objetos nuevos
- `ErrorLog` + `u_sp_RegistrarError` + logging en SPs críticos: pendiente de la fase 3.

## 7) Notas para el backend
- Todas las llamadas deben usar `u_sp_*`. Los repositorios ya fueron actualizados.
- El script canónico es la única fuente: `RentacarFinal.sql` (compat 160, sin rutas Windows, sin `OPTIMIZED_LOCKING`).
- Para una instalación limpia: `docker compose -f Producción/infra/docker-compose.yml up -d --build` (el `db-init` aplica el script raíz).
