# 01 — Modelo Relacional (Diccionario de datos)

Diccionario de `RentaCarDB`. Se detallan **completamente** las tablas del núcleo de
negocio y se **resumen** los catálogos (tablas de referencia con estructura homogénea
`ID + nombre + activo`).

Leyenda: **PK** = clave primaria · **FK** = clave foránea · **UQ** = único · **CK** = check.
Nulo: `NO` / `SÍ`.

---

## Módulo 1 — Geografía (Chile)

### `Region`
Propósito: regiones de Chile (16). Referencia estable.
- **PK:** `ID_region` · **UQ:** `nombre_region`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_region | int IDENTITY | NO | PK |
| nombre_region | nvarchar(100) | NO | UQ, CK no vacío |
| activo_region | bit | NO | |

### `Provincia`
Propósito: provincias (56); pertenecen a una región.
- **PK:** `ID_provincia` · **FK:** `ID_region_provincia → Region` · **UQ:** (`ID_region_provincia`,`nombre_provincia`)

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_provincia | int IDENTITY | NO | PK |
| ID_region_provincia | int | NO | FK→Region |
| nombre_provincia | nvarchar(100) | NO | CK no vacío |
| activo_provincia | bit | NO | |

### `Comuna`
Propósito: comunas (346); pertenecen a una provincia. Incluye código oficial (CUT).
- **PK:** `ID_comuna` · **FK:** `ID_provincia_comuna → Provincia` · **UQ:** (`ID_provincia_comuna`,`nombre_comuna`), `codigo_comuna`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_comuna | int IDENTITY | NO | PK |
| nombre_comuna | nvarchar(100) | NO | CK no vacío |
| activo_comuna | bit | NO | |
| codigo_comuna | varchar(5) | SÍ | UQ (CUT) |
| ID_provincia_comuna | int | NO | FK→Provincia |

> Jerarquía **Región → Provincia → Comuna** (1:N en cada nivel). La región **no** se
> duplica en `Comuna` (se obtiene vía `Provincia`) → 3FN.

---

## Módulo 2 — Personas y seguridad

### `Persona`
Propósito: identidad de las personas (base de `Usuario` y `Proveedor`).
- **PK:** `ID_persona` · **UQ:** `rut_persona`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_persona | int IDENTITY | NO | PK |
| rut_persona | varchar(12) | NO | UQ, CK formato + `fn_ValidarRut` |
| nombres_persona | nvarchar(80) | NO | CK no vacío |
| apellido_paterno_persona | nvarchar(50) | NO | CK no vacío |
| apellido_materno_persona | nvarchar(50) | SÍ | |
| telefono_persona | varchar(20) | SÍ | |
| fecha_nacimiento_persona | date | SÍ | |

### `Usuario`
Propósito: cuenta de acceso (email + hash de contraseña).
- **PK:** `ID_usuario` · **FK:** `ID_persona_usuario → Persona` · **UQ:** `email_usuario`, `ID_persona_usuario`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_usuario | int IDENTITY | NO | PK |
| ID_persona_usuario | int | NO | FK→Persona, UQ (1:1) |
| email_usuario | varchar(150) | NO | UQ |
| password_hash_usuario | varchar(255) | NO | |
| activo_usuario | bit | NO | |
| email_confirmado_usuario | bit | NO | |
| fecha_creacion_usuario | datetime2(0) | NO | |

### `Cliente`
Propósito: rol de cliente (usuario habilitado para reservar). Extensión 1:1 de `Usuario`.
- **PK:** `ID_usuario_cliente` (= FK a Usuario)

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_usuario_cliente | int | NO | PK, FK→Usuario |
| fecha_alta_cliente | datetime2(0) | NO | |
| activo_cliente | bit | NO | |

### `Rol` (catálogo)
`ID_rol` PK · `nombre_rol` UQ · `descripcion_rol`. Valores: ADMIN, OPERADOR, CLIENTE, PROVEEDOR.

### `UsuarioRol` (N:M)
`ID_usuario_usuario_rol` FK→Usuario · `ID_rol_usuario_rol` FK→Rol · `fecha_asignacion_usuario_rol`.
**PK** compuesta (`ID_usuario_usuario_rol`,`ID_rol_usuario_rol`).

### `ProveedorUsuario` (N:M)
`ID_proveedor_proveedor_usuario` FK→Proveedor · `ID_usuario_proveedor_usuario` FK→Usuario ·
`fecha_vinculacion_proveedor_usuario` · `es_administrador_proveedor_usuario`.
**PK** compuesta.

### `AceptacionTerminos`
Evidencia de aceptación de términos por un usuario.
`ID_aceptacion` PK · `ID_usuario_aceptacion` FK→Usuario · `version_terminos` · `fecha_aceptacion` · `ip_aceptacion` · `user_agent_aceptacion`.

### `EmailVerificacion`
Tokens de verificación de correo. `ID_email_verificacion` PK · `ID_usuario_email_verificacion` FK→Usuario · `token_hash_email_verificacion` UQ · expiración/uso/creación.

### `PasswordResetToken`
Tokens de restablecimiento de contraseña. `ID_password_reset` PK · `ID_usuario_password_reset` FK→Usuario · `token_hash_password_reset` UQ · expiración/uso/creación.

### `LoginHistorial` (técnica)
Registro de intentos de inicio de sesión. `ID_login` PK · `ID_usuario_login` FK→Usuario (nullable) · `email_intentado_login` · `exitoso_login` · `ip_login` · `user_agent_login` · `fecha_login`.

---

## Módulo 3 — Proveedores y sedes

### `Proveedor`
Propósito: dueño/gestor de vehículos (persona o empresa).
- **PK:** `ID_proveedor` · **FK:** tipo, persona, estado · **UQ:** `rut_proveedor`, `ID_persona_proveedor`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_proveedor | int IDENTITY | NO | PK |
| ID_tipo_proveedor_proveedor | int | NO | FK→TipoProveedor |
| ID_persona_proveedor | int | SÍ | FK→Persona |
| ID_estado_proveedor_proveedor | int | NO | FK→EstadoProveedor |
| razon_social_proveedor | nvarchar(150) | SÍ | |
| nombre_comercial_proveedor | nvarchar(150) | NO | CK no vacío |
| rut_proveedor | varchar(12) | SÍ | UQ |
| telefono_proveedor | varchar(50) | SÍ | |
| email_proveedor | varchar(150) | SÍ | |
| fecha_registro_proveedor | datetime2(0) | NO | |
| fecha_baja_proveedor | datetime2(0) | SÍ | |
| motivo_baja_proveedor | nvarchar(300) | SÍ | |

### `SedeProveedor`
Propósito: punto físico de retiro/devolución de un proveedor.
- **PK:** `ID_sede_proveedor` · **FK:** proveedor, comuna · **UQ:** (`ID_proveedor_sede_proveedor`,`nombre_sede_proveedor`)

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_sede_proveedor | int IDENTITY | NO | PK |
| ID_proveedor_sede_proveedor | int | NO | FK→Proveedor |
| ID_comuna_sede_proveedor | int | NO | FK→Comuna |
| nombre_sede_proveedor | nvarchar(100) | NO | |
| direccion_sede_proveedor | nvarchar(200) | NO | |
| telefono_sede_proveedor | varchar(20) | SÍ | |
| email_sede_proveedor | varchar(150) | SÍ | |
| activo_sede_proveedor | bit | NO | |

### `ConfiguracionProveedor`
Propósito: parámetros operativos por proveedor. Extensión 1:1 de `Proveedor`.
- **PK:** `ID_proveedor_configuracion_proveedor` (= FK a Proveedor)

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_proveedor_configuracion_proveedor | int | NO | PK, FK→Proveedor |
| permite_devolucion_otra_sede | bit | NO | |
| permite_entrega_domicilio | bit | NO | |
| permite_retiro_domicilio | bit | NO | |
| radio_maximo_km | decimal(8,2) | SÍ | CK >0 |
| minutos_expiracion_reserva | int | NO | CK 5–1440 |
| edad_minima_arriendo | int | SÍ | |
| requiere_deposito | bit | NO | |
| monto_deposito | decimal(14,2) | SÍ | CK ≥0 |
| dias_minimos_arriendo | int | SÍ | CK ≥1 |
| dias_maximos_arriendo | int | SÍ | CK ≥ mín |
| moneda_operacion | char(3) | NO | |

### `Comision`
Propósito: porcentaje de comisión de la plataforma (global si `ID_proveedor_comision` es NULL, o por proveedor).
- **PK:** `ID_comision` · **FK:** `ID_proveedor_comision → Proveedor` (nullable)

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_comision | int IDENTITY | NO | PK |
| ID_proveedor_comision | int | SÍ | FK→Proveedor (NULL = global) |
| porcentaje_comision | decimal(5,2) | NO | CK 0–100 |
| fecha_inicio_comision | date | NO | |
| fecha_fin_comision | date | SÍ | CK ≥ inicio |
| activo_comision | bit | NO | |

> Función `fn_ComisionAplicable(@ID_proveedor,@fecha)` resuelve la comisión vigente
> (proveedor específico > global).

---

## Módulo 4 — Vehículos

### `Vehiculo`
Propósito: unidad arrendable.
- **PK:** `ID_vehiculo` · **UQ:** `patente_vehiculo`, `vin_vehiculo` · **FK:** proveedor, sede actual, modelo, tipo, combustible, transmisión, estado, publicación.

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_vehiculo | int IDENTITY | NO | PK |
| ID_proveedor_vehiculo | int | NO | FK→Proveedor |
| ID_sede_actual_vehiculo | int | SÍ | FK→SedeProveedor |
| ID_modelo_vehiculo | int | NO | FK→Modelo |
| ID_tipo_vehiculo_vehiculo | int | NO | FK→TipoVehiculo |
| ID_tipo_combustible_vehiculo | int | NO | FK→TipoCombustible |
| ID_tipo_transmision_vehiculo | int | NO | FK→TipoTransmision |
| ID_estado_vehiculo_vehiculo | int | NO | FK→EstadoVehiculo |
| ID_estado_publicacion_vehiculo_vehiculo | int | NO | FK→EstadoPublicacionVehiculo |
| patente_vehiculo | varchar(10) | NO | UQ, CK formato (BBBB12/BBB12) |
| vin_vehiculo | varchar(17) | NO | UQ |
| anio_vehiculo | smallint | NO | CK 1950–2100 |
| kilometraje_vehiculo | int | NO | CK ≥0 |
| precio_diario_base_vehiculo | decimal(12,2) | NO | CK >0 |
| calificacion_promedio_vehiculo | decimal(3,2) | SÍ | (desnormalizado) |
| fecha_registro_vehiculo | datetime2(0) | NO | |
| fecha_baja_vehiculo | datetime2(0) | SÍ | |
| motivo_baja_vehiculo | nvarchar(300) | SÍ | |
| row_version_vehiculo | rowversion | NO | concurrencia |

### `Marca` / `Modelo`
`Marca`: `ID_marca` PK, `nombre_marca` UQ, `activo_marca`.
`Modelo`: `ID_modelo` PK, `ID_marca_modelo` FK→Marca, `nombre_modelo`, `activo_modelo`, **UQ** (`ID_marca_modelo`,`nombre_modelo`).

### `CaracteristicaVehiculo` (catálogo) + `VehiculoCaracteristica` (N:M)
`CaracteristicaVehiculo`: `ID_caracteristica_vehiculo` PK · `nombre_caracteristica` UQ ·
`categoria_caracteristica` (CK: EQUIPAMIENTO/SEGURIDAD/CONFORT/CONECTIVIDAD) · `descripcion_caracteristica` · `activo_caracteristica`.
`VehiculoCaracteristica`: **PK** (`ID_vehiculo_vehiculo_caracteristica`,`ID_caracteristica_vehiculo_caracteristica`) · `disponible_vehiculo_caracteristica` · `fecha_registro_vehiculo_caracteristica`. FKs a `Vehiculo` y `CaracteristicaVehiculo`.

### `VehiculoFoto`
`ID_foto_vehiculo` PK · `ID_vehiculo_vehiculo_foto` FK→Vehiculo · `url_foto_vehiculo` · `es_principal_foto` · `activo_foto_vehiculo` · `fecha_subida_foto`.

### `VehiculoComuna` (N:M)
Comunas donde se ofrece un vehículo. **PK** (`ID_vehiculo_vehiculo_comuna`,`ID_comuna_vehiculo_comuna`), FKs a `Vehiculo` y `Comuna`.

### `VehiculoSede` (N:M)
Sedes donde un vehículo puede entregarse/devolverse.
**PK** (`ID_vehiculo_vehiculo_sede`,`ID_sede_proveedor_vehiculo_sede`) · `disponible_para_entrega` · `disponible_para_devolucion` · `fecha_inicio_vehiculo_sede` · `fecha_fin_vehiculo_sede`.

### `TarifaVehiculo`
Propósito: reglas de precio por día.
- **PK:** `ID_tarifa` · **FK:** `ID_vehiculo_tarifa → Vehiculo`, `ID_proveedor_tarifa → Proveedor`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_tarifa | bigint IDENTITY | NO | PK |
| ID_vehiculo_tarifa | int | NO | FK→Vehiculo |
| ID_proveedor_tarifa | int | SÍ | FK→Proveedor |
| nombre_tarifa | varchar(80) | NO | |
| fecha_inicio_tarifa / fecha_fin_tarifa | date | NO | CK fin ≥ inicio |
| dia_semana_aplica | tinyint | SÍ | CK 1–7 |
| anticipacion_min_dias / anticipacion_max_dias | int | SÍ | |
| dias_minimos / dias_maximos | int | SÍ | |
| precio_dia_tarifa | decimal(14,2) | NO | CK >0 |
| prioridad_tarifa | int | NO | |
| activa_tarifa | bit | NO | |
| fecha_creacion_tarifa | datetime2(0) | NO | |
| ID_usuario_creacion | int | SÍ | |

> Función `fn_PrecioAplicable(@ID_vehiculo,@inicio,@fin)` elige la tarifa vigente.

### `DocumentoVehiculo` + `TipoDocumentoVehiculo` (catálogo)
`TipoDocumentoVehiculo`: `ID_tipo_documento_vehiculo` PK · `nombre_tipo_documento` UQ · `obligatorio_tipo_documento` · `activo_tipo_documento`.
`DocumentoVehiculo`: `ID_documento_vehiculo` PK · FK a Vehiculo y TipoDocumentoVehiculo · `numero_documento` · `fecha_emision_documento` · `fecha_vencimiento_documento` (NO, CK ≥ emisión) · `url_archivo_documento` · `verificado_documento` · `activo_documento` · `fecha_registro_documento`.

### `Mantenimiento` + `TipoMantenimiento` (catálogo)
`Mantenimiento`: `ID_mantenimiento` PK · FK a Vehiculo y TipoMantenimiento · `descripcion_mantenimiento` · `taller_mantenimiento` · `kilometraje_mantenimiento` (CK ≥0) · `costo_mantenimiento` (CK ≥0) · `fecha_inicio_mantenimiento` / `fecha_fin_mantenimiento` (CK fin ≥ inicio) · `activo_mantenimiento` · `fecha_registro_mantenimiento` · `ID_usuario_registro_mantenimiento` FK→Usuario.

### `MovimientoVehiculo`
Traslado entre sedes. `ID_movimiento_vehiculo` PK · `ID_vehiculo_movimiento_vehiculo` FK→Vehiculo · `ID_sede_origen_movimiento_vehiculo` / `ID_sede_destino_movimiento_vehiculo` FK→SedeProveedor (CK: distintas si ambas) · `fecha_movimiento_vehiculo` · `observacion_movimiento_vehiculo`.

---

## Módulo 5 — Reservas y arriendos

### `Reserva`
Propósito: núcleo del negocio. Solicitud de uso de un vehículo entre dos fechas.
- **PK:** `ID_reserva` · **FK:** cliente, vehículo, sedes, estado, política de cancelación.

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_reserva | int IDENTITY | NO | PK |
| ID_usuario_cliente_reserva | int | NO | FK→Cliente |
| ID_vehiculo_reserva | int | NO | FK→Vehiculo |
| ID_sede_retiro_reserva | int | NO | FK→SedeProveedor |
| ID_sede_devolucion_reserva | int | NO | FK→SedeProveedor |
| ID_estado_reserva_reserva | int | NO | FK→EstadoReserva |
| fecha_inicio_reserva / fecha_fin_reserva | date | NO | CK fin > inicio |
| precio_diario_aplicado_reserva | decimal(14,2) | NO | CK >0 |
| porcentaje_impuesto_aplicado_reserva | decimal(5,2) | NO | |
| monto_subtotal_reserva | decimal(14,2) | NO | |
| monto_descuento_reserva | decimal(14,2) | NO | CK ≥0 |
| monto_impuesto_reserva | decimal(14,2) | NO | |
| monto_total_reserva | decimal(14,2) | NO | CK >0 |
| monto_deposito_reserva | decimal(14,2) | NO | CK ≥0 |
| monto_reembolso_reserva | decimal(14,2) | NO | |
| politica_combustible_reserva | varchar(30) | SÍ | CK (LLENO_LLENO/MISMO_NIVEL/LIBRE) |
| km_incluidos_dia_reserva | int | SÍ | CK ≥0 |
| cargo_km_excedido_reserva | decimal(12,2) | SÍ | CK ≥0 |
| km_recorridos_reserva | int | SÍ | |
| cargo_km_total_reserva | decimal(12,2) | NO | CK ≥0 |
| fecha_reserva | datetime2(0) | NO | |
| fecha_expiracion_reserva | datetime2(0) | SÍ | |
| fecha_confirmacion_reserva | datetime2(0) | SÍ | |
| observaciones_reserva | nvarchar(500) | SÍ | |
| ID_politica_cancelacion_reserva | int | SÍ | FK→PoliticaCancelacion |
| correlation_id_reserva | uniqueidentifier | SÍ | trazabilidad |
| idempotency_key_reserva | varchar(100) | SÍ | UQ (evita duplicados) |
| moneda_reserva | char(3) | NO | DEFAULT 'CLP' |
| row_version_reserva | rowversion | NO | concurrencia |

### `EstadoReserva` (catálogo)
`ID_estado_reserva` PK · `nombre_estado_reserva` UQ. Valores: PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA, EXPIRADA.

### `TransicionEstadoReserva` (regla de negocio)
Define transiciones válidas de estado.
`ID_transicion` PK · `ID_estado_origen`/`ID_estado_destino` FK→EstadoReserva · `evento` · `requiere_pago` · `requiere_arriendo` · `activo` · **UQ** (`ID_estado_origen`,`ID_estado_destino`,`evento`).

### `HistorialEstadoReserva`
Bitácora de cambios de estado. `ID_historial` PK · `ID_reserva_historial` FK→Reserva · `ID_estado_anterior`/`ID_estado_nuevo` FK→EstadoReserva · `evento` · `motivo` · `ID_usuario_historial` FK→Usuario · `fecha_historial`.

### `BloqueoVehiculo`
Intervalos de no disponibilidad. `ID_bloqueo` PK · `ID_vehiculo_bloqueo` FK→Vehiculo · `tipo_bloqueo` (CK: RESERVA/MANTENIMIENTO/MANUAL/TRASLADO/ACCIDENTE/DOCUMENTACION) · `fecha_inicio_bloqueo`/`fecha_fin_bloqueo` (CK fin > inicio) · `activo_bloqueo` · `motivo_bloqueo` · `ID_reserva_bloqueo` FK→Reserva · `ID_mantenimiento_bloqueo` FK→Mantenimiento · `fecha_creacion_bloqueo` · `fecha_cierre_bloqueo` · `ID_usuario_creacion` FK→Usuario.

### `ReservaSnapshot`
Copia congelada de condiciones al reservar. `ID_snapshot` PK · `ID_reserva_snapshot` FK→Reserva · `version_snapshot` (**UQ** con reserva) · montos (precio_dia, subtotal, descuento, impuesto, total; CK ≥0) · `porcentaje_impuesto` (CK 0–100) · `porcentaje_comision` · `km_incluidos_dia` · `cargo_km_excedido` · `nombre_tarifa` · `politica_cancelacion` · `condiciones_comerciales` · `snapshot_json` · `hash_snapshot` · `fecha_snapshot` · `ID_usuario_snapshot` FK→Usuario.

### `Arriendo`
Propósito: ejecución real de la reserva. Relación 1:1 con `Reserva`.
- **PK:** `ID_arriendo` · **FK:** reserva, sedes reales, estado · **UQ:** `ID_reserva_arriendo`

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_arriendo | int IDENTITY | NO | PK |
| ID_reserva_arriendo | int | NO | FK→Reserva, UQ (1:1) |
| ID_sede_retiro_real_arriendo | int | NO | FK→SedeProveedor |
| ID_sede_devolucion_real_arriendo | int | SÍ | FK→SedeProveedor |
| ID_estado_arriendo_arriendo | int | NO | FK→EstadoArriendo |
| fecha_hora_retiro_real_arriendo | datetime2(0) | NO | |
| fecha_hora_devolucion_real_arriendo | datetime2(0) | SÍ | CK ≥ retiro |
| kilometraje_inicial_arriendo | int | NO | CK ≥0 |
| kilometraje_final_arriendo | int | SÍ | CK ≥ inicial |
| combustible_inicial_arriendo | decimal(5,2) | NO | CK 0–100 |
| combustible_final_arriendo | decimal(5,2) | SÍ | CK 0–100 |
| row_version_arriendo | rowversion | NO | concurrencia |

### `InspeccionArriendo` + `InspeccionDano` + `InspeccionFoto`
`InspeccionArriendo`: `ID_inspeccion_arriendo` PK · `ID_arriendo_inspeccion_arriendo` FK→Arriendo · `tipo_inspeccion` (CK: ENTREGA/DEVOLUCION) · `nivel_combustible_inspeccion` (CK 0–100) · `kilometraje_inspeccion` (CK ≥0) · `limpieza_inspeccion` (CK) · `observaciones_inspeccion` · `firma_cliente_inspeccion` · `ID_usuario_operador_inspeccion` FK→Usuario · `fecha_inspeccion` · **UQ** (arriendo,tipo).
`InspeccionDano`: `ID_inspeccion_dano` PK · FK→InspeccionArriendo · `zona_dano` · `tipo_dano` · `severidad_dano` (CK: LEVE/MEDIO/GRAVE) · `descripcion_dano` · `monto_estimado_dano` (CK ≥0) · `activo_dano` · `fecha_registro_dano`.
`InspeccionFoto`: `ID_inspeccion_foto` PK · FK→InspeccionArriendo · `url_foto_inspeccion` · `angulo_foto_inspeccion` (CK) · `activa_foto_inspeccion` · `fecha_subida_foto_inspeccion`.

### `ConductorAdicional`
`ID_conductor_adicional` PK · `ID_arriendo_conductor_adicional` FK→Arriendo · `ID_persona_conductor_adicional` FK→Persona · `ID_licencia_conducir_conductor_adicional` FK→LicenciaConducir · `activo_conductor_adicional` · `fecha_registro` · **UQ** (arriendo,persona).

### `LicenciaConducir` + `ClaseLicencia` (catálogo)
`LicenciaConducir`: `ID_licencia_conducir` PK · `ID_persona_licencia_conducir` FK→Persona · `ID_clase_licencia_licencia_conducir` FK→ClaseLicencia · `numero_licencia` UQ · `fecha_emision_licencia`/`fecha_vencimiento_licencia` (CK fin ≥ emisión) · `url_archivo_licencia` · `verificada_licencia` · `activa_licencia` · `fecha_registro_licencia`.
`ClaseLicencia`: `ID_clase_licencia` PK · `codigo_clase_licencia` UQ · `descripcion_clase_licencia` · `activo_clase_licencia` (A1…F, B).

### `AceptacionContratoArriendo`
Evidencia de aceptación del contrato. `ID_aceptacion_contrato` PK · `ID_arriendo_aceptacion` FK→Arriendo · `version_contrato` (**UQ** con arriendo) · `es_vigente` · `hash_contrato` (CK largo 64) · `url_contrato` · `fecha_generacion` · `fecha_aceptacion` · `ip_aceptacion` · `user_agent_aceptacion` · `ID_usuario_aceptacion` FK→Usuario.

---

## Módulo 6 — Pagos y finanzas

### `Pago`
Propósito: transacción monetaria.
- **PK:** `ID_pago` · **FK:** reserva, arriendo, cargo extra, tipo operación, método, estado.

| Columna | Tipo | Nulo | Restricción |
|---|---|---|---|
| ID_pago | int IDENTITY | NO | PK |
| ID_reserva_pago | int | NO | FK→Reserva |
| ID_arriendo_pago | int | SÍ | FK→Arriendo |
| ID_cargo_extra_pago | int | SÍ | FK→CargoExtra |
| ID_tipo_operacion_pago_pago | int | NO | FK→TipoOperacionPago |
| ID_metodo_pago_pago | int | NO | FK→MetodoPago |
| ID_estado_pago_pago | int | NO | FK→EstadoPago |
| monto_pago | decimal(14,2) | NO | CK >0 |
| moneda_pago | char(3) | NO | CK = 'CLP' |
| referencia_proveedor_pago | varchar(100) | SÍ | |
| idempotency_key_pago | varchar(100) | SÍ | UQ |
| referencia_externa_pago | varchar(150) | SÍ | |
| proveedor_pago | varchar(50) | SÍ | |
| fecha_pago | datetime2(0) | SÍ | |
| fecha_confirmacion_pago | datetime2(0) | SÍ | |
| row_version_pago | rowversion | NO | concurrencia |

### `Reembolso`
`ID_reembolso` PK · `ID_reserva_reembolso` FK→Reserva · `ID_pago_reembolso` FK→Pago · `monto_reembolso` (CK >0) · `moneda_reembolso` · `estado_reembolso` (CK: PENDIENTE/PROCESANDO/COMPLETADO/RECHAZADO/CANCELADO) · `motivo_reembolso` · `referencia_externa` · `idempotency_key_reembolso` UQ · `fecha_solicitud_reembolso` · `fecha_procesamiento_reembolso` · `ID_usuario_reembolso` FK→Usuario.

### `MovimientoFinanciero`
Asiento contable interno.
`ID_movimiento` PK · `ID_reserva_movimiento` FK→Reserva · `ID_pago_movimiento` FK→Pago · `tipo_movimiento` (CK: CARGO_RESERVA, PAGO, REEMBOLSO, COMISION_PLATAFORMA, CARGO_KM, CARGO_DANO, MULTA, DEPOSITO, LIBERACION_DEPOSITO, AJUSTE, DESCUENTO) · `monto_movimiento` (CK ≠0) · `moneda_movimiento` · `referencia_externa` · `descripcion` · `fecha_movimiento` · `ID_usuario_movimiento` FK→Usuario.

### `CargoExtra` + `TipoCargoExtra` (catálogo) + `EstadoCargoExtra` (catálogo)
`TipoCargoExtra`: `ID_tipo_cargo_extra` PK · `nombre_tipo_cargo_extra` UQ (CK: COMBUSTIBLE/KM_EXCEDIDO/DANO/LIMPIEZA/MULTA_TRANSITO/OTRO) · `descripcion_tipo_cargo_extra` · `activo_tipo_cargo_extra`.
`CargoExtra`: `ID_cargo_extra` PK · `ID_arriendo_cargo_extra` FK→Arriendo · `ID_estado_cargo_extra_cargo_extra` FK→EstadoCargoExtra · `ID_tipo_cargo_extra_cargo_extra` FK→TipoCargoExtra · `concepto_cargo_extra` (CK no vacío) · `monto_cargo_extra` (CK >0) · `fecha_registro_cargo_extra` · `observaciones_cargo_extra` · `row_version_cargo_extra`.

### `Multa` + `EstadoMulta` (catálogo)
`Multa`: `ID_multa` PK · `ID_arriendo_multa` FK→Arriendo · `ID_estado_multa_multa` FK→EstadoMulta · `fecha_multa` · `descripcion_multa` · `organismo_multa` · `numero_parte` · `monto_multa` (CK >0) · `fecha_registro_multa` · `ID_usuario_registro_multa` FK→Usuario · `row_version_multa`.

### `LiquidacionProveedor` + `EstadoLiquidacion` (catálogo)
`LiquidacionProveedor`: `ID_liquidacion` PK · `ID_proveedor_liquidacion` FK→Proveedor · `periodo_inicio`/`periodo_fin` (CK fin ≥ inicio) · `moneda_liquidacion` · `total_bruto` · `total_comision` · `total_reembolsos` · `total_ajustes` · `total_neto` · `estado_liquidacion` (CK: BORRADOR/CALCULADA/APROBADA/PAGADA/ANULADA) · `idempotency_key_liquidacion` UQ · `fecha_generacion` · `fecha_pago` · `ID_usuario_liquidacion` FK→Usuario · `row_version_liquidacion`.

### `PagoTransaccionSimulada`
Emulación Webpay. `ID_transaccion_simulada` PK · `ID_pago_transaccion_simulada` FK→Pago (UQ) · `buy_order_transaccion_simulada` UQ · `session_id_transaccion_simulada` UQ · `token_ws_transaccion_simulada` UQ · `monto_transaccion_simulada` (CK >0) · `estado_transaccion_simulada` (CK: CREADA/APROBADA/RECHAZADA/ABORTADA/REEMBOLSADA) · `fecha_creacion_transaccion_simulada` · `fecha_respuesta_transaccion_simulada`.

### `Disputa` + `EstadoDisputa` (catálogo)
`Disputa`: `ID_disputa` PK · `ID_arriendo_disputa` FK→Arriendo · `ID_usuario_reporta_disputa` FK→Usuario · `ID_estado_disputa_disputa` FK→EstadoDisputa · `tipo_disputa` · `descripcion_disputa` · `monto_disputado` (CK ≥0) · `resolucion_disputa` · `fecha_apertura_disputa`/`fecha_cierre_disputa` (CK cierre ≥ apertura).

---

## Módulo 7 — Comunicación y reputación

### `Conversacion`
Hilo cliente ↔ proveedor. `ID_conversacion` PK · `ID_usuario_conversacion` FK→Usuario · `ID_proveedor_conversacion` FK→Proveedor · `ID_vehiculo_conversacion` FK→Vehiculo · `activa_conversacion` · `fecha_inicio_conversacion` · `fecha_ultimo_mensaje` · `vehiculo_conversacion_calc` (columna calculada persistida) · `ultimo_mensaje_preview_conversacion` · `ID_usuario_ultimo_mensaje_conversacion` FK→Usuario · `archivada_cliente_conversacion` · `archivada_proveedor_conversacion`.

### `Mensaje`
`ID_mensaje` PK · `ID_conversacion_mensaje` FK→Conversacion · `ID_usuario_emisor_mensaje` FK→Usuario · `contenido_mensaje` (CK no vacío) · `leido_mensaje` · `fecha_mensaje` · `tipo_mensaje` (CK: TEXTO/IMAGEN/ARCHIVO/UBICACION/SISTEMA) · `fecha_entrega_mensaje` · `fecha_lectura_mensaje` · `editado_mensaje` · `eliminado_mensaje` · `fecha_edicion_mensaje` · `fecha_eliminacion_mensaje` · `ID_mensaje_padre_mensaje` FK→Mensaje (respuestas).

### `MensajeAdjunto`
`ID_adjunto_mensaje_adjunto` PK · `ID_mensaje_mensaje_adjunto` FK→Mensaje · `url_archivo_mensaje_adjunto` (CK no vacío) · `nombre_archivo_mensaje_adjunto` · `tipo_mime_mensaje_adjunto` · `tamano_bytes_mensaje_adjunto` (CK >0) · `fecha_subida_mensaje_adjunto` · `activo_mensaje_adjunto`.

### `Notificacion`
`ID_notificacion` PK · `ID_usuario_notificacion` FK→Usuario · `tipo_notificacion` · `canal_notificacion` (CK: EMAIL/SMS/PUSH) · `destinatario_notificacion` · `asunto_notificacion` · `cuerpo_notificacion` · `estado_notificacion` (CK: PENDIENTE/ENVIADA/FALLIDA) · `fecha_creacion_notificacion` · `fecha_envio_notificacion` · `error_notificacion`.

### `Resena` + `TipoResena` (catálogo)
`Resena`: `ID_resena` PK · `ID_arriendo_resena` FK→Arriendo · `ID_usuario_autor_resena` FK→Usuario · `ID_tipo_resena_resena` FK→TipoResena · `calificacion_resena` (CK 1–5) · `comentario_resena` · `fecha_resena` · `activo_resena` · **UQ** (arriendo, autor, tipo).
`TipoResena`: `ID_tipo_resena` PK · `nombre_tipo_resena` UQ · `descripcion_tipo_resena` · `activo_tipo_resena`.

### `FavoritoVehiculo` (N:M)
**PK** (`ID_usuario_favorito`,`ID_vehiculo_favorito`) · FKs a Usuario y Vehiculo · `fecha_favorito`.

### `BusquedaGuardada` (técnica)
`ID_busqueda` PK · `ID_usuario_busqueda` FK→Usuario · `nombre_busqueda` · `ID_comuna_busqueda` FK→Comuna · `ID_tipo_vehiculo_busqueda` FK→TipoVehiculo · `precio_maximo_busqueda` (CK >0) · `fecha_desde_busqueda`/`fecha_hasta_busqueda` · `activa_busqueda` · `fecha_creacion_busqueda`.

---

## Módulo 8 — Técnicas / plataforma

### `ConfiguracionGlobal`
Parámetros de plataforma (fila única).
`ID_configuracion` PK (CK =1) · `iva_porcentaje` (CK 0–100) · `comision_porcentaje` (CK 0–100) · `minutos_expiracion_reserva` (CK 1–1440) · `moneda` (CK largo 3) · `dias_minimos_publicacion` · `fecha_actualizacion`.

### `Auditoria`
`ID_auditoria` PK · `entidad` (CK no vacío) · `ID_registro` · `accion` (CK: INSERT/UPDATE/DELETE/STATE_CHANGE/FINANCIAL/PUBLISH/CUSTOM) · `ID_usuario` FK→Usuario · `fecha` · `valor_anterior` · `valor_nuevo` · `descripcion` · `correlation_id` · `origen` (CK) · `ip_origen` · `user_agent` · `motivo`.

### `OutboxEvento`
`ID_evento` PK · `tipo_evento` · `agregado_tipo` · `agregado_id` · `payload` (CK JSON válido) · `fecha_creacion` · `fecha_procesamiento` · `estado` (CK: PENDIENTE/PROCESANDO/PROCESADO/ERROR/CANCELADO) · `intentos` (CK ≥0) · `ultimo_error` · `lock_id` · `fecha_lock`.

### `MigracionLog`
`ID_migracion` PK · `nombre_migracion` UQ · `fecha_ejecucion` · `detalles`.

---

## Catálogos (resumen)

Estructura homogénea `ID + nombre (+ activo)`. Valores sembrados entre paréntesis.

| Catálogo | PK | UQ | Valores |
|---|---|---|---|
| `EstadoVehiculo` | ID_estado_vehiculo | nombre_estado_vehiculo | DISPONIBLE, ARRENDADO, EN_MANTENIMIENTO, FUERA_DE_SERVICIO |
| `EstadoPublicacionVehiculo` | ID_estado_publicacion_vehiculo | nombre_estado_publicacion_vehiculo | PENDIENTE, PUBLICADO, RECHAZADO, SUSPENDIDO |
| `EstadoProveedor` | ID_estado_proveedor | nombre_estado_proveedor | PENDIENTE, APROBADO, RECHAZADO, SUSPENDIDO, INACTIVO |
| `EstadoReserva` | ID_estado_reserva | nombre_estado_reserva | PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA, EXPIRADA |
| `EstadoArriendo` | ID_estado_arriendo | nombre_estado_arriendo | ACTIVO, FINALIZADO, CANCELADO |
| `EstadoPago` | ID_estado_pago | nombre_estado_pago | PENDIENTE, APROBADO, RECHAZADO, REEMBOLSADO |
| `EstadoCargoExtra` | ID_estado_cargo_extra | nombre_estado_cargo_extra | PENDIENTE, PAGADO, ANULADO |
| `EstadoMulta` | ID_estado_multa | nombre_estado_multa | PENDIENTE, COBRADA, ANULADA |
| `EstadoDisputa` | ID_estado_disputa | nombre_estado_disputa | ABIERTA, EN_REVISION, RESUELTA, CERRADA |
| `EstadoLiquidacion` | ID_estado_liquidacion | nombre_estado_liquidacion | BORRADOR, CALCULADA, PAGADA, ANULADA |
| `TipoVehiculo` | ID_tipo_vehiculo | nombre_tipo_vehiculo | SEDAN, SUV, HATCHBACK, PICKUP, VAN, COUPE |
| `TipoCombustible` | ID_tipo_combustible | nombre_tipo_combustible | GASOLINA, DIESEL, HIBRIDO, ELECTRICO |
| `TipoTransmision` | ID_tipo_transmision | nombre_tipo_transmision | MANUAL, AUTOMATICA |
| `TipoProveedor` | ID_tipo_proveedor | nombre_tipo_proveedor | PERSONA, EMPRESA |
| `TipoOperacionPago` | ID_tipo_operacion_pago | nombre_tipo_operacion_pago | RESERVA, ARRIENDO, EXTRA |
| `MetodoPago` | ID_metodo_pago | nombre_metodo_pago | TARJETA_DEBITO, TARJETA_CREDITO, TARJETA_PREPAGO, TRANSFERENCIA, EFECTIVO, WEBPAY_SIMULADO |
| `TipoDocumentoVehiculo` | ID_tipo_documento_vehiculo | nombre_tipo_documento | PERMISO_CIRCULACION, REVISION_TECNICA, SOAP, SEGURO |
| `TipoMantenimiento` | ID_tipo_mantenimiento | nombre_tipo_mantenimiento | PREVENTIVO, CORRECTIVO, REVISION_TECNICA, LAVADO, OTRO |
| `TipoResena` | ID_tipo_resena | nombre_tipo_resena | CLIENTE_A_PROVEEDOR, CLIENTE_A_VEHICULO, PROVEEDOR_A_CLIENTE |
| `TipoCargoExtra` | ID_tipo_cargo_extra | nombre_tipo_cargo_extra | COMBUSTIBLE, KM_EXCEDIDO, DANO, LIMPIEZA, MULTA_TRANSITO, OTRO |
| `CaracteristicaVehiculo` | ID_caracteristica_vehiculo | nombre_caracteristica | GPS, Aire acondicionado, Silla de bebe, Bluetooth, … (12) |
| `ClaseLicencia` | ID_clase_licencia | codigo_clase_licencia | A1…A5, B, C, D, E, F |
| `Marca` | ID_marca | nombre_marca | (dato de negocio) |
| `Modelo` | ID_modelo | (marca+nombre) | (dato de negocio) |
| `Rol` | ID_rol | nombre_rol | ADMIN, OPERADOR, CLIENTE, PROVEEDOR |
| `PoliticaCancelacion` | ID_politica_cancelacion | nombre_politica_cancelacion | FLEXIBLE, MODERADA, ESTRICTA, NO_REEMBOLSABLE |
| `Region` / `Provincia` / `Comuna` | ID_* | nombre (+ UQ) | 16 / 56 / 346 |
