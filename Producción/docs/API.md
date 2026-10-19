# API — Contratos REST

Base: `/api`. Autenticación: `Authorization: Bearer <JWT>`.
Errores uniformes: `{ "error": { "code": "...", "message": "...", "details": [...] } }`.

Convención: `PÚBLICO` (sin auth) · `AUTH` (logueado) · `ROL(x)` (rol requerido).

## Auth y usuarios

| Método | Ruta | Acceso | Cuerpo / Params | SP / Tabla |
|---|---|---|---|---|
| POST | `/auth/registro` | PÚBLICO | `{rut, nombres, apellidos, email, password, telefono?}` | `sp_RegistrarUsuario` |
| POST | `/auth/login` | PÚBLICO | `{email, password}` | `sp_Login` → JWT |
| POST | `/auth/logout` | AUTH | — | — |
| GET | `/auth/me` | AUTH | — | `Usuario`, `UsuarioRol`, `Persona` |
| POST | `/auth/verificar-email` | PÚBLICO | `{token}` | `sp_VerificarEmail` |
| POST | `/auth/recuperar` | PÚBLICO | `{email}` | `sp_SolicitarResetPassword` |
| POST | `/auth/recuperar/confirmar` | PÚBLICO | `{token, password}` | `sp_ConfirmarResetPassword` |
| PUT | `/usuarios/perfil` | AUTH | `{nombres, apellidos, telefono}` | `Persona`, `Usuario` |
| GET | `/usuarios/:id/roles` | ADMIN | — | `UsuarioRol` |

## Geografía (catálogos)

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET | `/regiones` | PÚBLICO | `Region` |
| GET | `/regiones/:id/provincias` | PÚBLICO | `Provincia` |
| GET | `/provincias/:id/comunas` | PÚBLICO | `Comuna` |
| GET | `/comunas?q=` | PÚBLICO | `Comuna` |

## Proveedores y sedes

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/proveedores` | AUTH | `sp_RegistrarProveedor` |
| GET | `/proveedores` | ADMIN | `Proveedor` (filtros por estado/tipo) |
| GET | `/proveedores/:id` | AUTH | `Proveedor`, `ConfiguracionProveedor` |
| PATCH | `/proveedores/:id/aprobar` | ADMIN | `sp_AprobarProveedor` |
| PUT | `/proveedores/:id/configuracion` | ROL(PROVEEDOR) | `ConfiguracionProveedor` |
| GET/POST/PUT/DELETE | `/proveedores/:id/sedes[/:sedeId]` | ROL(PROVEEDOR) | `SedeProveedor` |
| GET | `/reportes/proveedores` | ADMIN | `sp_ReporteProveedores` |

## Vehículos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET | `/vehiculos` | PÚBLICO | `vw_VehiculosPublicados` (filtros: comuna, tipo, precio, fechas) |
| GET | `/vehiculos/:id` | PÚBLICO | `Vehiculo` + características + fotos + tarifas |
| POST | `/vehiculos` | ROL(PROVEEDOR) | `Vehiculo` |
| PUT | `/vehiculos/:id` | ROL(PROVEEDOR) | `Vehiculo` |
| POST | `/vehiculos/:id/publicar` | ROL(PROVEEDOR) | `sp_PublicarVehiculo` |
| POST | `/vehiculos/:id/fotos` | ROL(PROVEEDOR) | `VehiculoFoto` (upload) |
| GET/POST | `/vehiculos/:id/caracteristicas` | ROL(PROVEEDOR) | `VehiculoCaracteristica` |
| GET/POST | `/vehiculos/:id/tarifas` | ROL(PROVEEDOR) | `TarifaVehiculo` |
| GET/POST | `/vehiculos/:id/documentos` | ROL(PROVEEDOR) | `sp_RegistrarDocumentoVehiculo` |
| GET | `/vehiculos/:id/disponibilidad?desde&hasta` | PÚBLICO | `vw_V5_VehiculosDisponibles` |
| GET | `/vehiculos/buscar` | PÚBLICO | `sp_V5_BuscarVehiculos` |
| GET/POST/DELETE | `/favoritos[/:vehiculoId]` | AUTH | `FavoritoVehiculo` |

## Reservas

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/reservas` | ROL(CLIENTE) | `sp_V5_CrearReserva` (idempotency_key) |
| GET | `/reservas` | AUTH | `vw_ReservasDetalle` (cliente ve las suyas; proveedor las de sus vehículos) |
| GET | `/reservas/:id` | AUTH | `vw_ReservasDetalle` |
| POST | `/reservas/:id/estado` | AUTH | `sp_V5_CambiarEstadoReserva` |
| POST | `/reservas/:id/cancelar` | ROL(CLIENTE) | `sp_V5_CancelarReserva` (reembolso opcional) |
| GET | `/reservas/:id/historial` | AUTH | `HistorialEstadoReserva` |
| GET | `/reservas/:id/snapshot` | AUTH | `ReservaSnapshot` |
| GET/POST | `/reservas/:id/cupones` | — | **N/A** (cupones retirados) |

## Pagos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/pagos` | AUTH | `sp_RegistrarPago` |
| GET | `/pagos?reserva=` | AUTH | `Pago` |
| POST | `/pagos/webpay/iniciar` | ROL(CLIENTE) | `sp_WP_IniciarTransaccion` → `{token_ws, url}` |
| POST | `/pagos/webpay/confirmar` | ROL(CLIENTE) | `sp_WP_ConfirmarTransaccion` |
| POST | `/reembolsos` | AUTH | `sp_V5_CrearReembolso` |
| POST | `/reembolsos/:id/completar` | ADMIN | `sp_V5_MarcarReembolsoCompletado` |
| GET | `/reportes/ingresos?anio` | ADMIN | `sp_V5_ReporteIngresosMensuales` |

## Arriendos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/arriendos/iniciar` | ROL(OPERADOR/PROVEEDOR) | `sp_IniciarArriendo` |
| POST | `/arriendos/:id/devolucion` | ROL(OPERADOR/PROVEEDOR) | `sp_RegistrarDevolucion` |
| GET | `/arriendos/:id` | AUTH | `Arriendo` + inspecciones |
| POST | `/arriendos/:id/inspecciones` | ROL(OPERADOR) | `InspeccionArriendo`, `sp_RegistrarDanoInspeccion` |
| POST | `/arriendos/:id/conductores` | ROL(CLIENTE) | `sp_RegistrarConductorAdicional` |
| POST | `/arriendos/:id/contrato` | ROL(CLIENTE) | `sp_V5_CrearAceptacionContrato` |
| POST | `/arriendos/:id/cargos-extra` | ROL(OPERADOR) | `sp_CrearCargoExtra` |
| POST | `/arriendos/:id/multas` | ROL(OPERADOR/ADMIN) | `sp_RegistrarMulta` |

## Liquidaciones, disputas, reseñas, chat

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/liquidaciones` | ADMIN | `sp_V5_GenerarLiquidacion` |
| GET | `/liquidaciones?proveedor=` | ROL(PROVEEDOR)/ADMIN | `LiquidacionProveedor` |
| POST | `/liquidaciones/:id/aprobar` | ADMIN | `sp_V5_AprobarLiquidacion` |
| POST | `/liquidaciones/:id/pagar` | ADMIN | `sp_V5_MarcarLiquidacionPagada` |
| GET | `/reportes/liquidaciones` | ADMIN | `sp_ReporteLiquidaciones` |
| POST | `/disputas` | AUTH | `Disputa` |
| GET | `/disputas` | ADMIN | `Disputa` |
| POST | `/resenas` | AUTH | `sp_CrearResena` |
| GET | `/vehiculos/:id/resenas` | PÚBLICO | `Resena` |
| POST | `/conversaciones` | AUTH | `sp_CrearConversacion` |
| GET | `/conversaciones` | AUTH | `sp_ListarConversaciones` |
| GET | `/conversaciones/:id/mensajes` | AUTH | `sp_ListarMensajes` |
| POST | `/conversaciones/:id/mensajes` | AUTH | `sp_EnviarMensaje` |
| POST | `/conversaciones/:id/leidos` | AUTH | `sp_MarcarMensajesLeidos` |
| POST | `/conversaciones/:id/cerrar` | AUTH | `sp_CerrarConversacion` |

## Administración y catálogos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET/POST/PUT | `/admin/catalogos/:tabla` | ADMIN | `Tipo*`, `Estado*`, `Marca`, `Modelo`, `PoliticaCancelacion`, `CaracteristicaVehiculo`, `TipoCargoExtra` |
| GET | `/admin/auditoria` | ADMIN | `Auditoria` |
| GET | `/admin/outbox` | ADMIN | `sp_V5_ObtenerOutboxPendiente` |
| GET | `/admin/integridad` | ADMIN | `sp_V5_ValidarIntegridad` |
| GET | `/health` | PÚBLICO | — (estado API/BD) |

## Notas de implementación

- **Idempotencia:** `POST /reservas`, `/pagos` y `/reembolsos` aceptan `idempotency_key` en el cuerpo.
- **Paginación:** `?page=&pageSize=` en listados; respuesta `{ data, page, pageSize, total }`.
- **Filtros de vehículos:** comuna, tipo, marca, rango de precio, fechas, características.
- **Uploads:** `multipart/form-data`; se guardan en storage y se registra la URL en BD.
- **Swagger:** se publica en `/api/docs` (OpenAPI 3).
