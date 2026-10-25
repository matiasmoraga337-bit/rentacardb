# BACKLOG — Épicas, historias y tareas

Estimación en **puntos de historia (SP)** (Fibonacci: 1, 2, 3, 5, 8, 13).
Prioridad **MoSCoW**: `M` = Must · `S` = Should · `C` = Could.

> Total estimado: **~230 SP** para 3 personas en 4 semanas (≈ 60–75 SP/persona). Las épicas
> marcadas `C` son **extensión** (se hacen si hay tiempo).

---

## E1 — Infraestructura y setup `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E1.1 | Como equipo quiero levantar el proyecto con un comando | 5 | Repos mono‑repo · `docker-compose` (api, web, mssql) · `.env.example` · healthcheck |
| E1.2 | Como dev quiero conexión a BD desde la API | 3 | Pool `mssql`, config, test de conexión, script `database/` |
| E1.3 | Como dev quiero CI (lint+test+build) | 3 | GitHub Actions: backend y frontend |
| E1.4 | Como dev quiero lint/format consistente | 2 | ESLint + Prettier + Husky (pre-commit) |

## E2 — Autenticación y usuarios `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E2.1 | Registrarme (persona+usuario+cliente) | 8 | `u_sp_RegistrarUsuario`, validación zod, hash bcrypt, UI registro |
| E2.2 | Iniciar sesión y obtener JWT | 5 | `u_sp_Login`, JWT, refresh/expiración, UI login |
| E2.3 | Verificar correo | 3 | `u_sp_VerificarEmail`, envío (cola/outbox), UI verificación |
| E2.4 | Recuperar contraseña | 5 | `u_sp_SolicitarResetPassword` + `u_sp_ConfirmarResetPassword`, UI |
| E2.5 | Ver mi perfil y editarlo | 3 | `Persona`/`Usuario`, UI perfil |
| E2.6 | Roles y guards (CLIENTE/PROVEEDOR/OPERADOR/ADMIN) | 5 | `UsuarioRol`, middleware `authorize`, guards de ruta |

## E3 — Geografía y catálogos `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E3.1 | Ver regiones/provincias/comunas | 3 | Endpoints + selects en UI |
| E3.2 | CRUD de catálogos (admin) | 5 | Endpoints genéricos + UI admin |

> **Estado S4-E3.2:** CRUD de catálogos de negocio implementado; los catálogos
> de sistema (`tipos-proveedor`, `estados-*`) quedan de solo lectura. Ver
> [`../../docs/CATALOGOS.md`](../../docs/CATALOGOS.md).

## E4 — Proveedores y sedes `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E4.1 | Registrarme como proveedor | 5 | `u_sp_RegistrarProveedor`, UI |
| E4.2 | Aprobar/rechazar proveedor (admin) | 3 | `u_sp_AprobarProveedor`, UI admin |
| E4.3 | Configurar mi proveedor | 3 | `ConfiguracionProveedor`, UI |
| E4.4 | Gestionar mis sedes | 5 | CRUD `SedeProveedor`, UI |

## E5 — Vehículos `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E5.1 | Crear/editar vehículo | 8 | `Vehiculo`, validaciones, UI form |
| E5.2 | Subir fotos | 5 | Upload + `VehiculoFoto`, galería |
| E5.3 | Características (N:M) | 3 | `VehiculoCaracteristica`, UI chips |
| E5.4 | Tarifas por día | 5 | `TarifaVehiculo`, UI reglas |
| E5.5 | Documentos legales | 5 | `u_sp_RegistrarDocumentoVehiculo`, upload, vencimientos |
| E5.6 | Publicar vehículo | 3 | `u_sp_PublicarVehiculo`, UI |

## E6 — Búsqueda y disponibilidad `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E6.1 | Buscar vehículos con filtros | 8 | `u_sp_BuscarVehiculos`/`vw_VehiculosPublicados`, UI filtros |
| E6.2 | Ver disponibilidad por fechas | 5 | `vw_VehiculosDisponibles` |
| E6.3 | Favoritos | 3 | `FavoritoVehiculo`, UI |
| E6.4 | Búsquedas guardadas | 3 | `BusquedaGuardada`, UI |

> **Estado S4-E6.3/E6.4:** implementadas. Ver
> [`../../docs/FAVORITOS-BUSQUEDAS.md`](../../docs/FAVORITOS-BUSQUEDAS.md).

## E7 — Reservas `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E7.1 | Crear reserva (fechas, sedes) | 8 | `u_sp_CrearReserva`, idempotencia, UI checkout |
| E7.2 | Ver mis reservas y detalle | 5 | `vw_ReservasDetalle`, UI |
| E7.3 | Cambiar estado / cancelar | 5 | `u_sp_CambiarEstadoReserva`, `u_sp_CancelarReserva` |
| E7.4 | Ver historial y snapshot | 3 | `HistorialEstadoReserva`, `ReservaSnapshot` |
| E7.5 | Expiración de reservas | 3 | Job/scheduler que llama `u_sp_ExpirarReservas` |

## E8 — Pagos (Webpay simulado) `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E8.1 | Registrar pago | 5 | `u_sp_RegistrarPago`, UI |
| E8.2 | Pagar con Webpay simulado | 8 | `u_sp_WebPay_IniciarTransaccion`/`u_sp_WebPay_ConfirmarTransaccion`, UI flujo |
| E8.3 | Reembolsos | 5 | `u_sp_CrearReembolso`, UI |
| E8.4 | Reporte de ingresos | 3 | `u_sp_ReporteIngresosMensuales`, gráfico |

> **Estado S2:** E7.1–E7.5 y E8.1–E8.4 implementadas y verificadas. Ver
> [`../../docs/RESERVAS-PAGOS.md`](../../docs/RESERVAS-PAGOS.md),
> [`../../docs/DEMO-S2.md`](../../docs/DEMO-S2.md) y `sql/tests/05_reservas_pagos.sql`.

## E9 — Arriendos e inspecciones `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E9.1 | Iniciar arriendo (retiro) | 5 | `u_sp_IniciarArriendo`, UI operador |
| E9.2 | Registrar devolución | 8 | `u_sp_RegistrarDevolucion`, UI |
| E9.3 | Inspección entrega/devolución + daños | 8 | `InspeccionArriendo`, `u_sp_RegistrarDanoInspeccion`, fotos |
| E9.4 | Conductores adicionales | 3 | `u_sp_RegistrarConductorAdicional` |
| E9.5 | Aceptación de contrato | 3 | `u_sp_CrearAceptacionContrato`, UI firma |

> **Estado S3-E9:** E9.1–E9.5 implementadas y verificadas. Ver
> [`../../docs/ARRIENDOS.md`](../../docs/ARRIENDOS.md),
> [`../../docs/DEMO-S3.md`](../../docs/DEMO-S3.md) y `sql/tests/06_arriendos.sql`.

## E10 — Cargos extra, multas, disputas `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E10.1 | Crear cargo extra | 3 | `u_sp_CrearCargoExtra`, UI |
| E10.2 | Registrar multa | 3 | `u_sp_RegistrarMulta`, UI |
| E10.3 | Abrir/gestionar disputa | 5 | `Disputa`, UI |

> **Estado S4-E10:** E10.1/E10.2 implementadas con movimiento financiero
> (`CARGO_EXTRA`/`MULTA`) para liquidaciones. E10.3 implementada: apertura por
> cliente/proveedor, listado por rol y resolucion ADMIN. Ver
> [`../../docs/CARGOS-MULTAS.md`](../../docs/CARGOS-MULTAS.md) y
> [`../../docs/DISPUTAS.md`](../../docs/DISPUTAS.md).

## E11 — Liquidaciones y comisiones `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E11.1 | Generar liquidación por período | 5 | `u_sp_GenerarLiquidacion`, UI admin |
| E11.2 | Aprobar/pagar liquidación | 3 | `u_sp_AprobarLiquidacion`, `u_sp_MarcarLiquidacionPagada` |
| E11.3 | Ver liquidaciones (proveedor) | 3 | `LiquidacionProveedor`, UI |

> **Estado S4-E11:** implementadas. Admin genera por proveedor/periodo y
> aprueba/paga; el proveedor ve sus liquidaciones. Ver
> [`../../docs/LIQUIDACIONES.md`](../../docs/LIQUIDACIONES.md).

## E12 — Chat y notificaciones `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E12.1 | Conversar con proveedor/cliente | 8 | `u_sp_CrearConversacion`, `u_sp_EnviarMensaje`, `u_sp_ListarMensajes`, UI chat |
| E12.2 | Adjuntos en mensajes | 3 | `MensajeAdjunto`, upload |
| E12.3 | Notificaciones + worker outbox | 5 | `Notificacion`, `OutboxEvento`, worker, UI campana |

> **Estado S4-E12:** E12.1 implementada y verificada. E12.3 implementada:
> notificaciones in-app, correo y worker outbox con reintentos. Adjuntos (E12.2)
> implementados en el chat. Ver [`../../docs/CHAT.md`](../../docs/CHAT.md) y
> [`../../docs/NOTIFICACIONES.md`](../../docs/NOTIFICACIONES.md).

## E13 — Reseñas `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E13.1 | Crear reseña tras arriendo | 3 | `u_sp_CrearResena`, UI |
| E13.2 | Ver reseñas de vehículo/proveedor | 2 | `Resena`, UI |

> **Estado S3-E13:** E13.1 y E13.2 implementadas. Cliente y proveedor califican
> el arriendo `FINALIZADO` desde el detalle; el vehículo público muestra promedio
> y reseñas. Ver [`../../docs/RESENAS.md`](../../docs/RESENAS.md).

## E14 — Paneles `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E14.1 | Panel cliente (reservas, pagos, chat) | 8 | Layout + widgets |
| E14.2 | Panel proveedor (vehículos, sedes, liquidaciones) | 8 | Layout + widgets |
| E14.3 | Panel admin (proveedores, catálogos, disputas, auditoría) | 8 | Layout + widgets |

> **Estado S3-E14:** paneles de cliente, proveedor y admin implementados sobre
> `/panel`. Admin agrega `/admin/catalogos` (consulta) y `/admin/auditoria`.
> Liquidaciones, disputas y edición de catálogos quedan para S4. Ver
> [`../../docs/PANELES.md`](../../docs/PANELES.md).

## E15 — Calidad: testing, seguridad, docs `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E15.1 | Tests de API de flujos críticos | 8 | Jest + Supertest (reserva, pago, devolución) |
| E15.2 | Tests de UI de componentes clave | 5 | Vitest + Testing Library |
| E15.3 | Hardening de seguridad | 5 | OWASP, rate limit, CORS, secretos, validación |
| E15.4 | Documentación (README, API, manual) | 5 | Swagger + manual de usuario |

## E16 — Despliegue y demo `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E16.1 | Despliegue Docker reproducible | 5 | Compose final + volúmenes |
| E16.2 | (Opcional) Deploy en Render | 3 | Backend + BD gestionada o túnel |
| E16.3 | Datos de ejemplo + guion de demo | 5 | Seed + escenario de presentación |

---

## Resumen por prioridad

| Prioridad | SP aprox. | Épicas |
|---|---|---|
| **M (Must)** | ~165 | E1–E9, E14, E15, E16 |
| **S (Should)** | ~50 | E10–E13 |
| **C (Could)** | ~15 | extras (mapas, i18n, temas) |

**Regla:** todo lo `M` debe estar terminado el **10‑nov**; lo `S` hasta el **16‑nov**.
