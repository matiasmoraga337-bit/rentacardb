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
| `vw_VehiculosDisponibles` | `vw_VehiculosDisponibles` |
| `fn_PrecioAplicable` | `fn_PrecioAplicable` |

## 3) Constraints e índices
Se eliminaron los sufijos `_v5` y `_v6` de todos los nombres (70 ocurrencias). Ejemplos:
`PK_auditoria_v6`, `PK_aceptacion_contrato_v5`, `PK_bloqueo_vehiculo_v5`,
`PK_liquidacion_proveedor_v5`, `PK_movimiento_financiero_v5`, `PK_outbox_evento_v5`,
`PK_reserva_snapshot_v5`, `PK_reembolso_v5`, `PK_tarifa_vehiculo_v5`,
`PK_transicion_estado_reserva_v5`, `UQ_transicion_estado_v5`, `DF_auditoria_fecha_v6`,
`UX_reembolso_idempotency_key_v6`, `IX_reserva_expiracion_v6`, `IX_auditoria_correlation_v6`,
`IX_auditoria_entidad_fecha_v6`, `IX_auditoria_origen_fecha_v6`, y todos los `FK_*_v5` / `CK_*_v5`.

## 4) Columnas (Regla 2)
Renombrado manual por grupos. **Grupo 1 — `Auditoria`** (aplicado):

| Antes | Después |
|---|---|
| `entidad` | `entidad_auditoria` |
| `ID_registro` | `ID_registro_auditoria` |
| `accion` | `accion_auditoria` |
| `ID_usuario` | `ID_usuario_auditoria` |
| `fecha` | `fecha_auditoria` |
| `valor_anterior` | `valor_anterior_auditoria` |
| `valor_nuevo` | `valor_nuevo_auditoria` |
| `descripcion` | `descripcion_auditoria` |
| `correlation_id` | `correlation_id_auditoria` |
| `origen` | `origen_auditoria` |
| `ip_origen` | `ip_origen_auditoria` |
| `user_agent` | `user_agent_auditoria` |
| `motivo` | `motivo_auditoria` |

Se actualizaron tabla, PK, índices (`IX_auditoria_*`), `DF_auditoria_fecha`, `CK_auditoria_*`,
`FK_auditoria_usuario` (la FK local; `Usuario(ID_usuario)` se mantiene) y los triggers
`trg_Pago_AfterInsert_Auditoria` / `trg_Reserva_AfterUpdate_Auditoria`.

**Grupo 2 — `OutboxEvento`** (aplicado):

| Antes | Después |
|---|---|
| `agregado_tipo` | `agregado_tipo_outbox_evento` |
| `agregado_id` | `agregado_id_outbox_evento` |
| `payload` | `payload_outbox_evento` |
| `fecha_creacion` | `fecha_creacion_outbox_evento` |
| `fecha_procesamiento` | `fecha_procesamiento_outbox_evento` |
| `estado` | `estado_outbox_evento` |
| `intentos` | `intentos_outbox_evento` |
| `ultimo_error` | `ultimo_error_outbox_evento` |
| `lock_id` | `lock_id_outbox_evento` |
| `fecha_lock` | `fecha_lock_outbox_evento` |

Se actualizaron tabla, índices `IX_outbox_*`, defaults, `CK_outbox_*`, INSERTs de outbox en
reservas/pagos y los SPs `u_sp_PublicarEvento`, `u_sp_ObtenerOutboxPendiente`,
`u_sp_MarcarEventoProcesado`, `u_sp_ReintentarOutboxError` (sin tocar `@payload`, `@lock_id`
ni literales como `'PENDIENTE'`).

**Grupo 3 — `ReservaSnapshot`** (aplicado): `precio_dia`, `cantidad_dias`, `subtotal`,
`descuento`, `impuesto`, `total`, `porcentaje_impuesto`, `porcentaje_comision`,
`km_incluidos_dia`, `cargo_km_excedido`, `nombre_tarifa`, `politica_cancelacion`,
`condiciones_comerciales`, `snapshot_json` → mismo nombre + `_reserva_snapshot`.
Se actualizaron tabla, defaults, `CK_reserva_snapshot_*`, `INSERT` de `u_sp_CrearSnapshotReserva`
y `u_sp_ValidarIntegridad`. Se conservaron alias del `FOR JSON` y variables.

**Grupo 4 — `LiquidacionProveedor`** (aplicado): `periodo_inicio`, `periodo_fin`,
`total_bruto`, `total_comision`, `total_reembolsos`, `total_ajustes`, `total_neto`,
`fecha_generacion`, `fecha_pago` → mismo nombre + `_liquidacion_proveedor`.
Se actualizaron tabla, defaults, `CK_liquidacion_proveedor_periodo`, `u_sp_GenerarLiquidacion`,
`u_sp_MarcarLiquidacionPagada` y `u_sp_ReporteLiquidaciones`. No se tocaron `Pago.fecha_pago`
ni `AceptacionContratoArriendo.fecha_generacion`.

**Grupo 5 — `ConfiguracionGlobal` y `ConfiguracionProveedor`** (aplicado):
`iva_porcentaje`, `comision_porcentaje`, `minutos_expiracion_reserva`, `moneda`,
`dias_minimos_publicacion`, `fecha_actualizacion` → `_configuracion_global`;
`permite_devolucion_otra_sede`, `permite_entrega_domicilio`, `permite_retiro_domicilio`,
`radio_maximo_km`, `minutos_expiracion_reserva`, `edad_minima_arriendo`, `requiere_deposito`,
`monto_deposito`, `dias_minimos_arriendo`, `dias_maximos_arriendo`, `moneda_operacion`
→ `_configuracion_proveedor`. Se actualizaron defaults, CHECKs, seed, funcion de comision,
SPs de reserva/config y el SELECT del backend.

**Grupo 6 — `TransicionEstadoReserva` / `HistorialEstadoReserva`** (aplicado):
`ID_transicion`, `ID_estado_origen`, `ID_estado_destino`, `evento`, `requiere_pago`,
`requiere_arriendo`, `activo` → `_transicion_estado_reserva`; `ID_estado_anterior`,
`ID_estado_nuevo`, `evento`, `motivo` → `_historial_estado_reserva`.
Se actualizaron seed, UQ, índices, FKs, defaults, `u_sp_CambiarEstadoReserva` y los INSERT de historial.

**Grupo 7 — tablas menores** (aplicado): `VehiculoSede.disponible_para_*` → `_vehiculo_sede`;
`Reembolso.referencia_externa` → `_reembolso`; `MovimientoFinanciero.referencia_externa`/`descripcion`
→ `_movimiento_financiero`; `AceptacionContratoArriendo.es_vigente`/`fecha_generacion`
→ `_aceptacion_contrato_arriendo`; `Conversacion.fecha_ultimo_mensaje`/`vehiculo_conversacion_calc`
→ `_conversacion`; `ConductorAdicional.fecha_registro` → `_conductor_adicional`;
`MigracionLog.fecha_ejecucion`/`detalles` → `_migracion_log`; `BloqueoVehiculo.ID_usuario_creacion`
→ `_bloqueo_vehiculo`; `Multa.numero_parte` → `_multa`; `TarifaVehiculo.dia_semana_aplica`,
`anticipacion_*`, `dias_*`, `ID_usuario_creacion` → `_tarifa_vehiculo`.
Se actualizaron índices (incluido el computed column y el índice filtrado de conversación) y SPs.

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
