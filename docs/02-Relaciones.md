# 02 — Relaciones y cardinalidades

Todas las relaciones de `RentaCarDB`. **Notación:** `#` = lado **uno (1)** · `∞` = lado
**muchos (N)**. La **clave foránea (FK) siempre vive en el lado `∞`** (el hijo).

> Regla de lectura: `Padre # —— ∞ Hijo` significa "un Padre tiene muchos Hijos, y cada
> Hijo apunta a un Padre con su FK".

Todas las FK son **NO ACTION** (sin `ON DELETE/UPDATE CASCADE`): el borrado en cascada se
evita a propósito (se usan bajas lógicas con `activo_*` / `fecha_baja_*`).

---

## 1) Relaciones 1:N (uno a muchos)

### Geografía
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Region | ∞ | Provincia | ID_region_provincia |
| 1 | Provincia | ∞ | Comuna | ID_provincia_comuna |
| 1 | Comuna | ∞ | SedeProveedor | ID_comuna_sede_proveedor |
| 1 | Comuna | ∞ | VehiculoComuna | ID_comuna_vehiculo_comuna |
| 1 | Comuna | ∞ | BusquedaGuardada | ID_comuna_busqueda |

### Personas y seguridad
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Persona | ∞ | Usuario | ID_persona_usuario |
| 1 | Persona | ∞ | Proveedor | ID_persona_proveedor |
| 1 | Persona | ∞ | LicenciaConducir | ID_persona_licencia_conducir |
| 1 | Persona | ∞ | ConductorAdicional | ID_persona_conductor_adicional |
| 1 | Usuario | ∞ | AceptacionTerminos | ID_usuario_aceptacion |
| 1 | Usuario | ∞ | UsuarioRol | ID_usuario_usuario_rol |
| 1 | Usuario | ∞ | ProveedorUsuario | ID_usuario_proveedor_usuario |
| 1 | Usuario | ∞ | EmailVerificacion | ID_usuario_email_verificacion |
| 1 | Usuario | ∞ | PasswordResetToken | ID_usuario_password_reset |
| 1 | Usuario | ∞ | LoginHistorial | ID_usuario_login |
| 1 | Usuario | ∞ | Auditoria | ID_usuario |
| 1 | Usuario | ∞ | BusquedaGuardada | ID_usuario_busqueda |
| 1 | Usuario | ∞ | FavoritoVehiculo | ID_usuario_favorito |
| 1 | Usuario | ∞ | Conversacion | ID_usuario_conversacion |
| 1 | Usuario | ∞ | Mensaje | ID_usuario_emisor_mensaje |
| 1 | Usuario | ∞ | Notificacion | ID_usuario_notificacion |
| 1 | Usuario | ∞ | Resena | ID_usuario_autor_resena |
| 1 | Usuario | ∞ | Mantenimiento | ID_usuario_registro_mantenimiento |
| 1 | Usuario | ∞ | Multa | ID_usuario_registro_multa |
| 1 | Usuario | ∞ | InspeccionArriendo | ID_usuario_operador_inspeccion |
| 1 | Usuario | ∞ | MovimientoFinanciero | ID_usuario_movimiento |
| 1 | Usuario | ∞ | Reembolso | ID_usuario_reembolso |
| 1 | Usuario | ∞ | LiquidacionProveedor | ID_usuario_liquidacion |
| 1 | Usuario | ∞ | AceptacionContratoArriendo | ID_usuario_aceptacion |
| 1 | Usuario | ∞ | BloqueoVehiculo | ID_usuario_creacion |
| 1 | Usuario | ∞ | ReservaSnapshot | ID_usuario_snapshot |
| 1 | Rol | ∞ | UsuarioRol | ID_rol_usuario_rol |

### Proveedores y sedes
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Proveedor | ∞ | SedeProveedor | ID_proveedor_sede_proveedor |
| 1 | Proveedor | ∞ | Vehiculo | ID_proveedor_vehiculo |
| 1 | Proveedor | ∞ | TarifaVehiculo | ID_proveedor_tarifa |
| 1 | Proveedor | ∞ | Comision | ID_proveedor_comision |
| 1 | Proveedor | ∞ | Conversacion | ID_proveedor_conversacion |
| 1 | Proveedor | ∞ | ProveedorUsuario | ID_proveedor_proveedor_usuario |
| 1 | Proveedor | ∞ | LiquidacionProveedor | ID_proveedor_liquidacion |

### Vehículos
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Marca | ∞ | Modelo | ID_marca_modelo |
| 1 | Modelo | ∞ | Vehiculo | ID_modelo_vehiculo |
| 1 | TipoVehiculo | ∞ | Vehiculo | ID_tipo_vehiculo_vehiculo |
| 1 | TipoCombustible | ∞ | Vehiculo | ID_tipo_combustible_vehiculo |
| 1 | TipoTransmision | ∞ | Vehiculo | ID_tipo_transmision_vehiculo |
| 1 | EstadoVehiculo | ∞ | Vehiculo | ID_estado_vehiculo_vehiculo |
| 1 | EstadoPublicacionVehiculo | ∞ | Vehiculo | ID_estado_publicacion_vehiculo_vehiculo |
| 1 | SedeProveedor | ∞ | Vehiculo | ID_sede_actual_vehiculo |
| 1 | Vehiculo | ∞ | VehiculoFoto | ID_vehiculo_vehiculo_foto |
| 1 | Vehiculo | ∞ | VehiculoComuna | ID_vehiculo_vehiculo_comuna |
| 1 | Vehiculo | ∞ | VehiculoSede | ID_vehiculo_vehiculo_sede |
| 1 | Vehiculo | ∞ | VehiculoCaracteristica | ID_vehiculo_vehiculo_caracteristica |
| 1 | CaracteristicaVehiculo | ∞ | VehiculoCaracteristica | ID_caracteristica_vehiculo_caracteristica |
| 1 | Vehiculo | ∞ | TarifaVehiculo | ID_vehiculo_tarifa |
| 1 | Vehiculo | ∞ | DocumentoVehiculo | ID_vehiculo_documento_vehiculo |
| 1 | TipoDocumentoVehiculo | ∞ | DocumentoVehiculo | ID_tipo_documento_vehiculo_documento_vehiculo |
| 1 | Vehiculo | ∞ | Mantenimiento | ID_vehiculo_mantenimiento |
| 1 | TipoMantenimiento | ∞ | Mantenimiento | ID_tipo_mantenimiento_mantenimiento |
| 1 | Vehiculo | ∞ | MovimientoVehiculo | ID_vehiculo_movimiento_vehiculo |
| 1 | SedeProveedor | ∞ | MovimientoVehiculo | ID_sede_origen_movimiento_vehiculo |
| 1 | SedeProveedor | ∞ | MovimientoVehiculo | ID_sede_destino_movimiento_vehiculo |

### Reservas y arriendos
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Cliente | ∞ | Reserva | ID_usuario_cliente_reserva |
| 1 | Vehiculo | ∞ | Reserva | ID_vehiculo_reserva |
| 1 | SedeProveedor | ∞ | Reserva | ID_sede_retiro_reserva |
| 1 | SedeProveedor | ∞ | Reserva | ID_sede_devolucion_reserva |
| 1 | EstadoReserva | ∞ | Reserva | ID_estado_reserva_reserva |
| 1 | PoliticaCancelacion | ∞ | Reserva | ID_politica_cancelacion_reserva |
| 1 | Reserva | ∞ | Arriendo | ID_reserva_arriendo |
| 1 | EstadoArriendo | ∞ | Arriendo | ID_estado_arriendo_arriendo |
| 1 | SedeProveedor | ∞ | Arriendo | ID_sede_retiro_real_arriendo |
| 1 | SedeProveedor | ∞ | Arriendo | ID_sede_devolucion_real_arriendo |
| 1 | Reserva | ∞ | HistorialEstadoReserva | ID_reserva_historial |
| 1 | EstadoReserva | ∞ | HistorialEstadoReserva | ID_estado_anterior |
| 1 | EstadoReserva | ∞ | HistorialEstadoReserva | ID_estado_nuevo |
| 1 | EstadoReserva | ∞ | TransicionEstadoReserva | ID_estado_origen |
| 1 | EstadoReserva | ∞ | TransicionEstadoReserva | ID_estado_destino |
| 1 | Vehiculo | ∞ | BloqueoVehiculo | ID_vehiculo_bloqueo |
| 1 | Reserva | ∞ | BloqueoVehiculo | ID_reserva_bloqueo |
| 1 | Mantenimiento | ∞ | BloqueoVehiculo | ID_mantenimiento_bloqueo |
| 1 | Reserva | ∞ | ReservaSnapshot | ID_reserva_snapshot |
| 1 | Arriendo | ∞ | InspeccionArriendo | ID_arriendo_inspeccion_arriendo |
| 1 | InspeccionArriendo | ∞ | InspeccionDano | ID_inspeccion_arriendo_inspeccion_dano |
| 1 | InspeccionArriendo | ∞ | InspeccionFoto | ID_inspeccion_arriendo_inspeccion_foto |
| 1 | Arriendo | ∞ | ConductorAdicional | ID_arriendo_conductor_adicional |
| 1 | ClaseLicencia | ∞ | LicenciaConducir | ID_clase_licencia_licencia_conducir |
| 1 | LicenciaConducir | ∞ | ConductorAdicional | ID_licencia_conducir_conductor_adicional |
| 1 | Arriendo | ∞ | AceptacionContratoArriendo | ID_arriendo_aceptacion |

### Pagos y finanzas
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Reserva | ∞ | Pago | ID_reserva_pago |
| 1 | Arriendo | ∞ | Pago | ID_arriendo_pago |
| 1 | CargoExtra | ∞ | Pago | ID_cargo_extra_pago |
| 1 | TipoOperacionPago | ∞ | Pago | ID_tipo_operacion_pago_pago |
| 1 | MetodoPago | ∞ | Pago | ID_metodo_pago_pago |
| 1 | EstadoPago | ∞ | Pago | ID_estado_pago_pago |
| 1 | Reserva | ∞ | Reembolso | ID_reserva_reembolso |
| 1 | Pago | ∞ | Reembolso | ID_pago_reembolso |
| 1 | Reserva | ∞ | MovimientoFinanciero | ID_reserva_movimiento |
| 1 | Pago | ∞ | MovimientoFinanciero | ID_pago_movimiento |
| 1 | Arriendo | ∞ | CargoExtra | ID_arriendo_cargo_extra |
| 1 | EstadoCargoExtra | ∞ | CargoExtra | ID_estado_cargo_extra_cargo_extra |
| 1 | TipoCargoExtra | ∞ | CargoExtra | ID_tipo_cargo_extra_cargo_extra |
| 1 | Arriendo | ∞ | Multa | ID_arriendo_multa |
| 1 | EstadoMulta | ∞ | Multa | ID_estado_multa_multa |
| 1 | Arriendo | ∞ | Disputa | ID_arriendo_disputa |
| 1 | EstadoDisputa | ∞ | Disputa | ID_estado_disputa_disputa |
| 1 | Pago | ∞ | PagoTransaccionSimulada | ID_pago_transaccion_simulada |

### Comunicación y reputación
| # | Padre | ∞ | Hijo | FK en el hijo |
|---|-------|---|------|----------------|
| 1 | Conversacion | ∞ | Mensaje | ID_conversacion_mensaje |
| 1 | Mensaje | ∞ | MensajeAdjunto | ID_mensaje_mensaje_adjunto |
| 1 | Mensaje | ∞ | Mensaje | ID_mensaje_padre_mensaje (auto‑referencia: respuestas) |
| 1 | Arriendo | ∞ | Resena | ID_arriendo_resena |
| 1 | TipoResena | ∞ | Resena | ID_tipo_resena_resena |
| 1 | Vehiculo | ∞ | FavoritoVehiculo | ID_vehiculo_favorito |
| 1 | Vehiculo | ∞ | Conversacion | ID_vehiculo_conversacion |
| 1 | TipoVehiculo | ∞ | BusquedaGuardada | ID_tipo_vehiculo_busqueda |

---

## 2) Relaciones 1:1 (uno a uno)

Se implementan poniendo la **PK del hijo = FK del padre** (o un `UNIQUE` sobre la FK).

| # | Tabla A | 1:1 | Tabla B | Cómo se garantiza |
|---|---------|-----|---------|-------------------|
| 1 | Persona | ↔ | Usuario | `UQ_usuario_persona` (ID_persona_usuario) |
| 1 | Usuario | ↔ | Cliente | `Cliente.ID_usuario_cliente` es PK y FK |
| 1 | Proveedor | ↔ | ConfiguracionProveedor | PK `ID_proveedor_configuracion_proveedor` es FK |
| 1 | Reserva | ↔ | Arriendo | `UQ_arriendo_reserva` (ID_reserva_arriendo) |
| 1 | Pago | ↔ | PagoTransaccionSimulada | `UQ_pago_transaccion_pago` (ID_pago_transaccion_simulada) |

---

## 3) Relaciones N:M (muchos a muchos)

Se implementan con **tablas asociativas** cuya PK es la **combinación de las dos FK**.

| Tabla A | N:M | Tabla B | Tabla asociativa | PK compuesta |
|---------|-----|---------|------------------|--------------|
| Usuario | N:M | Rol | `UsuarioRol` | (ID_usuario_usuario_rol, ID_rol_usuario_rol) |
| Usuario | N:M | Proveedor | `ProveedorUsuario` | (ID_proveedor_proveedor_usuario, ID_usuario_proveedor_usuario) |
| Usuario | N:M | Vehiculo | `FavoritoVehiculo` | (ID_usuario_favorito, ID_vehiculo_favorito) |
| Vehiculo | N:M | Comuna | `VehiculoComuna` | (ID_vehiculo_vehiculo_comuna, ID_comuna_vehiculo_comuna) |
| Vehiculo | N:M | SedeProveedor | `VehiculoSede` | (ID_vehiculo_vehiculo_sede, ID_sede_proveedor_vehiculo_sede) |
| Vehiculo | N:M | CaracteristicaVehiculo | `VehiculoCaracteristica` | (ID_vehiculo_vehiculo_caracteristica, ID_caracteristica_vehiculo_caracteristica) |

---

## 4) Verificación (FK en el lado correcto)

- [x] **Toda FK está en el lado `∞`** (el hijo): nunca hay una FK apuntando "hacia el uno".
- [x] **Toda relación 1:N** tiene su FK indexada (cobertura de índices sobre FK).
- [x] **Las 6 relaciones N:M** usan tabla asociativa con PK compuesta; ninguna duplica datos.
- [x] **Las 5 relaciones 1:1** usan PK=FK o `UNIQUE` sobre la FK, impidiendo más de una fila.
- [x] **Auto‑referencia** controlada: `Mensaje.ID_mensaje_padre_mensaje → Mensaje` (respuestas).
- [x] **Sin `ON DELETE CASCADE`**: las bajas son lógicas (`activo_*`, `fecha_baja_*`), evitando borrados masivos accidentales.
