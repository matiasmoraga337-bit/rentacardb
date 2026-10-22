# API — Contratos REST

Base: `/api`. Autenticación: `Authorization: Bearer <JWT>`.
Errores uniformes: `{ "error": { "code": "...", "message": "...", "details": [...] } }`.

Convención: `PÚBLICO` (sin auth) · `AUTH` (logueado) · `ROL(x)` (rol requerido).

## Auth y usuarios

| Método | Ruta | Acceso | Cuerpo / Params | SP / Tabla |
|---|---|---|---|---|
| POST | `/auth/registro` | PÚBLICO | `{rut, nombres, apellidos, email, password, telefono?}` | `u_sp_RegistrarUsuario` |
| POST | `/auth/login` | PÚBLICO | `{email, password}` | `u_sp_Login` → JWT |
| POST | `/auth/logout` | AUTH | — | — |
| GET | `/auth/me` | AUTH | — | `Usuario`, `UsuarioRol`, `Persona` |
| POST | `/auth/verificar-email` | PÚBLICO | `{token}` | `u_sp_VerificarEmail` |
| POST | `/auth/recuperar` | PÚBLICO | `{email}` | `u_sp_SolicitarResetPassword` |
| POST | `/auth/recuperar/confirmar` | PÚBLICO | `{token, password}` | `u_sp_ConfirmarResetPassword` |
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
| POST | `/proveedores` | AUTH | `u_sp_RegistrarProveedor` |
| GET | `/proveedores` | ADMIN | `Proveedor` (filtros por estado/tipo) |
| GET | `/proveedores/:id` | AUTH | `Proveedor`, `ConfiguracionProveedor` |
| PATCH | `/proveedores/:id/aprobar` | ADMIN | `u_sp_AprobarProveedor` |
| PUT | `/proveedores/:id/configuracion` | ROL(PROVEEDOR) | `ConfiguracionProveedor` |
| GET/POST/PUT/DELETE | `/proveedores/:id/sedes[/:sedeId]` | ROL(PROVEEDOR) | `SedeProveedor` |
| GET | `/reportes/proveedores` | ADMIN | `u_sp_ReporteProveedores` |

## Vehículos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET | `/vehiculos` | PÚBLICO | `vw_VehiculosPublicados` (filtros: comuna, tipo, precio, fechas) |
| GET | `/vehiculos/:id` | PÚBLICO | `Vehiculo` + características + fotos + tarifas |
| POST | `/vehiculos` | ROL(PROVEEDOR) | `Vehiculo` |
| PUT | `/vehiculos/:id` | ROL(PROVEEDOR) | `Vehiculo` |
| POST | `/vehiculos/:id/publicar` | ROL(PROVEEDOR) | `u_sp_PublicarVehiculo` |
| POST | `/vehiculos/:id/fotos` | ROL(PROVEEDOR) | `VehiculoFoto` (upload) |
| GET/POST | `/vehiculos/:id/caracteristicas` | ROL(PROVEEDOR) | `VehiculoCaracteristica` |
| GET/POST | `/vehiculos/:id/tarifas` | ROL(PROVEEDOR) | `TarifaVehiculo` |
| GET/POST | `/vehiculos/:id/documentos` | ROL(PROVEEDOR) | `u_sp_RegistrarDocumentoVehiculo` |
| GET | `/vehiculos/:id/disponibilidad?desde&hasta` | PÚBLICO | `vw_VehiculosDisponibles` |
| GET | `/vehiculos/buscar` | PÚBLICO | `u_sp_BuscarVehiculos` |
| GET/POST/DELETE | `/favoritos[/:vehiculoId]` | AUTH | `FavoritoVehiculo` |

## Reservas

| Método | Ruta | Acceso | SP / Vista / Tabla | Notas |
|---|---|---|---|---|
| GET | `/vehiculos/:id/disponibilidad?desde&hasta` | PÚBLICO | `vw_VehiculosDisponibles`, `fn_PrecioAplicable`, `ConfiguracionGlobal/Proveedor` | Devuelve `{disponible, motivo, precioDia, dias, subtotal, impuesto, deposito, total}`. |
| GET | `/vehiculos/:id` | PÚBLICO | `Vehiculo` + `VehiculoSede` | Incluye `sedes[]` con flags de entrega/devolución. |
| POST | `/reservas` | ROL(CLIENTE) | `u_sp_CrearReserva` | `Idempotency-Key` obligatorio. `ID_usuario_cliente` sale del JWT. |
| GET | `/reservas?scope=&estado=&page=&pageSize=` | AUTH | `vw_ReservasDetalle` + `Reserva` | `scope=cliente` (propias), `scope=proveedor` (sus vehículos), `todos` (ADMIN). Respuesta `{data,page,pageSize,total}`. |
| GET | `/reservas/:id` | AUTH | `vw_ReservasDetalle` + `Reserva` | Incluye `reembolsos[]`. Ownership cliente/proveedor/admin. |
| POST | `/reservas/:id/estado` | ADMIN | `u_sp_CambiarEstadoReserva` | S2: `CONFIRMADA`, `CANCELADA`, `EXPIRADA`. Si hay pago aprobado, `CANCELADA` se rechaza y debe usarse `/cancelar`. |
| GET | `/reservas/:id/cancelacion` | AUTH | `PoliticaCancelacion` + `Pago` + `Reembolso` | Previsualiza política, monto pagado y reembolso estimado. |
| POST | `/reservas/:id/cancelar` | ROL(CLIENTE/ADMIN) dueño | `u_sp_CancelarReserva` | Body `{motivo, solicitar_reembolso, motivo_reembolso?}`. `Idempotency-Key` obligatorio si hay reembolso. ADMIN también puede cancelar con reembolso. |
| GET | `/reservas/:id/historial` | AUTH | `HistorialEstadoReserva` | Estados anterior/nuevo, evento, motivo y usuario. |
| GET | `/reservas/:id/snapshot` | AUTH | `ReservaSnapshot` | Versiones congeladas de precios/condiciones. |
| POST | `/admin/reservas/expirar` | ADMIN | `u_sp_ExpirarReservas` | Ejecución manual del job (cursor). |

## Pagos

| Método | Ruta | Acceso | SP / Tabla | Notas |
|---|---|---|---|---|
| POST | `/pagos` | ADMIN | `u_sp_RegistrarPago` | Registro manual/operativo. El cliente **no** puede autoaprobar pagos. |
| GET | `/pagos?reserva=` | AUTH | `Pago` + catálogos | Ownership de la reserva. |
| POST | `/pagos/webpay/iniciar` | ROL(CLIENTE) dueño | `u_sp_WebPay_IniciarTransaccion` | Body `{ID_reserva}`. El monto se obtiene de la reserva. Devuelve `{token_ws, url, ID_pago, monto}`. |
| GET | `/pagos/webpay/transaccion/:token` | AUTH dueño | `PagoTransaccionSimulada` | Datos para la confirmación simulada. |
| POST | `/pagos/webpay/confirmar` | ROL(CLIENTE) dueño | `u_sp_WebPay_ConfirmarTransaccion` | Body `{token_ws, aprobada}`. Solo una confirmación por token. |
| POST | `/reembolsos` | ADMIN | `u_sp_CrearReembolso` | `idempotency_key` obligatorio. |
| POST | `/reembolsos/:id/completar` | ADMIN | `u_sp_MarcarReembolsoCompletado` | |
| GET | `/reembolsos?reserva=` | AUTH | `Reembolso` | Ownership de la reserva. |
| GET | `/reportes/ingresos?anio&ID_proveedor=` | ADMIN | `u_sp_ReporteIngresosMensuales` | Reporte mensual. |

> Los flujos de pago y reembolso se documentan en detalle en
> [`docs/RESERVAS-PAGOS.md`](../../docs/RESERVAS-PAGOS.md). Los triggers y el
> cursor se justifican en
> [`docs/JUSTIFICACION-TRIGGERS-CURSOR.md`](../../docs/JUSTIFICACION-TRIGGERS-CURSOR.md).

## Arriendos

| Método | Ruta | Acceso | SP / Tabla | Notas |
|---|---|---|---|---|
| GET | `/arriendos?scope=cliente\|proveedor\|todos&estado=&page=&pageSize=` | AUTH | `Arriendo`, `Reserva`, `Vehiculo`, `EstadoArriendo` | Cliente ve los suyos; proveedor los de sus vehículos; admin todos. |
| GET | `/arriendos/:id` | AUTH dueño/proveedor/admin | `Arriendo` + inspecciones + daños + cargos + multas + conductores + contrato + reseñas | Detalle completo. |
| POST | `/arriendos/iniciar` | ROL(OPERADOR/PROVEEDOR/ADMIN) | `u_sp_IniciarArriendo` | Requiere reserva `CONFIRMADA`, licencia vigente y sede válida. |
| POST | `/arriendos/:id/devolucion` | ROL(OPERADOR/PROVEEDOR/ADMIN) | `u_sp_RegistrarDevolucion` | Calcula km excedido y crea cargo automático. |
| POST | `/arriendos/:id/inspecciones/:inspeccionId/danos` | ROL(OPERADOR/PROVEEDOR/ADMIN) | `u_sp_RegistrarDanoInspeccion` | Solo inspección `DEVOLUCION`. |
| POST | `/arriendos/:id/cargos-extra` | ROL(OPERADOR/PROVEEDOR/ADMIN) | `u_sp_CrearCargoExtra` | Solo arriendo `FINALIZADO`; body `{concepto, monto, tipo_cargo?, observaciones?}`. Crea movimiento `CARGO_EXTRA`. |
| POST | `/arriendos/:id/multas` | ROL(OPERADOR/PROVEEDOR/ADMIN) | `u_sp_RegistrarMulta` | Solo arriendo `FINALIZADO`; body `{fecha_multa, descripcion, monto, organismo?, numero_parte?}`. Crea movimiento `MULTA`. |
| POST | `/arriendos/:id/conductores` | ROL(CLIENTE) | `u_sp_RegistrarConductorAdicional` | Body `{rut, ID_licencia_conducir?}`. |
| POST | `/arriendos/:id/contrato` | ROL(CLIENTE) | `u_sp_CrearAceptacionContrato` | Body `{aceptado:true}`; guarda hash SHA-256. |
| GET | `/arriendos/:id/contrato` | AUTH dueño/proveedor/admin | `AceptacionContratoArriendo` + datos de reserva | Devuelve texto, hash y aceptación vigente. |
| POST | `/arriendos/:id/cargos-extra` | ROL(OPERADOR) | `u_sp_CrearCargoExtra` | S4. |
| POST | `/arriendos/:id/multas` | ROL(OPERADOR/ADMIN) | `u_sp_RegistrarMulta` | S4. |

> El flujo de arriendo se documenta en [`../../docs/ARRIENDOS.md`](../../docs/ARRIENDOS.md) y el guion en [`../../docs/DEMO-S3.md`](../../docs/DEMO-S3.md).

## Liquidaciones, disputas, reseñas, chat

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| POST | `/liquidaciones` | ADMIN | `u_sp_GenerarLiquidacion` |
| GET | `/liquidaciones?proveedor=` | ROL(PROVEEDOR)/ADMIN | `LiquidacionProveedor` |
| POST | `/liquidaciones/:id/aprobar` | ADMIN | `u_sp_AprobarLiquidacion` |
| POST | `/liquidaciones/:id/pagar` | ADMIN | `u_sp_MarcarLiquidacionPagada` |
| GET | `/reportes/liquidaciones` | ADMIN | `u_sp_ReporteLiquidaciones` |
| POST | `/disputas` | AUTH | `Disputa` |
| GET | `/disputas` | ADMIN | `Disputa` |
| POST | `/resenas` | AUTH dueño/proveedor | `u_sp_CrearResena`. Body `{ID_arriendo, tipo_resena, calificacion, comentario?}`. Solo arriendo `FINALIZADO`; una reseña por autor y tipo. |
| GET | `/vehiculos/:id/resenas` | PÚBLICO | `Resena` + `TipoResena`. Devuelve `{total, promedio, resenas[]}` con las reseñas `CLIENTE_A_VEHICULO`. |
| GET | `/proveedores/:id/resenas` | PÚBLICO | `Resena` + `TipoResena`. Devuelve `{total, promedio, resenas[]}` con las reseñas `CLIENTE_A_PROVEEDOR`. |
| POST | `/conversaciones` | ROL(CLIENTE) | `u_sp_CrearConversacion` |
| GET | `/conversaciones` | AUTH | `u_sp_ListarConversaciones` |
| GET | `/conversaciones/:id/mensajes` | AUTH participante | `u_sp_ListarMensajes` |
| POST | `/conversaciones/:id/mensajes` | AUTH participante | `u_sp_EnviarMensaje` (solo TEXTO en S3) |
| POST | `/conversaciones/:id/leidos` | AUTH participante | `u_sp_MarcarMensajesLeidos` |
| POST | `/conversaciones/:id/cerrar` | AUTH participante | `u_sp_CerrarConversacion` |

## Administración y catálogos

| Método | Ruta | Acceso | SP / Tabla |
|---|---|---|---|
| GET/POST/PUT | `/admin/catalogos/:tabla` | ADMIN | `Tipo*`, `Estado*`, `Marca`, `Modelo`, `PoliticaCancelacion`, `CaracteristicaVehiculo`, `TipoCargoExtra` |
| GET | `/admin/auditoria?entidad=&page=&pageSize=` | ADMIN | `Auditoria` + usuario. Devuelve `{data, page, pageSize, total}`. |
| GET | `/admin/outbox` | ADMIN | `u_sp_ObtenerOutboxPendiente` |
| GET | `/admin/integridad` | ADMIN | `u_sp_ValidarIntegridad` |
| POST | `/admin/reservas/expirar` | ADMIN | `u_sp_ExpirarReservas` |
| GET | `/health` | PÚBLICO | — (estado API/BD) |

## Notas de implementación

- **Idempotencia:** `POST /reservas` exige `Idempotency-Key` (header) o `idempotency_key`; `POST /reservas/:id/cancelar` la exige cuando hay reembolso; `POST /reembolsos` la exige en el cuerpo. `POST /pagos` (ADMIN) no soporta idempotencia en el SP actual.
- **WebPay:** `iniciar` reutiliza una transacción `CREADA` pendiente; `confirmar` solo acepta reservas `PENDIENTE`, sin pago aprobado y con token `CREADA`. El SP usa `UPDLOCK/HOLDLOCK` (migración `sql/migrations/2026-10-21_s2_webpay_hardening.sql`).
- **Paginación:** `GET /reservas` usa `?page=&pageSize=`; respuesta `{ data, page, pageSize, total }`.
- **Filtros de vehículos:** comuna, tipo, marca, rango de precio, fechas, características.
- **Uploads:** `multipart/form-data`; se guardan en storage y se registra la URL en BD.
- **Swagger:** se publica en `/api/docs` (OpenAPI 3).
