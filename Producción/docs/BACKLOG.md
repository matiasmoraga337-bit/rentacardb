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
| E2.1 | Registrarme (persona+usuario+cliente) | 8 | `sp_RegistrarUsuario`, validación zod, hash bcrypt, UI registro |
| E2.2 | Iniciar sesión y obtener JWT | 5 | `sp_Login`, JWT, refresh/expiración, UI login |
| E2.3 | Verificar correo | 3 | `sp_VerificarEmail`, envío (cola/outbox), UI verificación |
| E2.4 | Recuperar contraseña | 5 | `sp_SolicitarResetPassword` + `sp_ConfirmarResetPassword`, UI |
| E2.5 | Ver mi perfil y editarlo | 3 | `Persona`/`Usuario`, UI perfil |
| E2.6 | Roles y guards (CLIENTE/PROVEEDOR/OPERADOR/ADMIN) | 5 | `UsuarioRol`, middleware `authorize`, guards de ruta |

## E3 — Geografía y catálogos `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E3.1 | Ver regiones/provincias/comunas | 3 | Endpoints + selects en UI |
| E3.2 | CRUD de catálogos (admin) | 5 | Endpoints genéricos + UI admin |

## E4 — Proveedores y sedes `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E4.1 | Registrarme como proveedor | 5 | `sp_RegistrarProveedor`, UI |
| E4.2 | Aprobar/rechazar proveedor (admin) | 3 | `sp_AprobarProveedor`, UI admin |
| E4.3 | Configurar mi proveedor | 3 | `ConfiguracionProveedor`, UI |
| E4.4 | Gestionar mis sedes | 5 | CRUD `SedeProveedor`, UI |

## E5 — Vehículos `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E5.1 | Crear/editar vehículo | 8 | `Vehiculo`, validaciones, UI form |
| E5.2 | Subir fotos | 5 | Upload + `VehiculoFoto`, galería |
| E5.3 | Características (N:M) | 3 | `VehiculoCaracteristica`, UI chips |
| E5.4 | Tarifas por día | 5 | `TarifaVehiculo`, UI reglas |
| E5.5 | Documentos legales | 5 | `sp_RegistrarDocumentoVehiculo`, upload, vencimientos |
| E5.6 | Publicar vehículo | 3 | `sp_PublicarVehiculo`, UI |

## E6 — Búsqueda y disponibilidad `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E6.1 | Buscar vehículos con filtros | 8 | `sp_V5_BuscarVehiculos`/`vw_VehiculosPublicados`, UI filtros |
| E6.2 | Ver disponibilidad por fechas | 5 | `vw_V5_VehiculosDisponibles` |
| E6.3 | Favoritos | 3 | `FavoritoVehiculo`, UI |
| E6.4 | Búsquedas guardadas | 3 | `BusquedaGuardada`, UI |

## E7 — Reservas `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E7.1 | Crear reserva (fechas, sedes) | 8 | `sp_V5_CrearReserva`, idempotencia, UI checkout |
| E7.2 | Ver mis reservas y detalle | 5 | `vw_ReservasDetalle`, UI |
| E7.3 | Cambiar estado / cancelar | 5 | `sp_V5_CambiarEstadoReserva`, `sp_V5_CancelarReserva` |
| E7.4 | Ver historial y snapshot | 3 | `HistorialEstadoReserva`, `ReservaSnapshot` |
| E7.5 | Expiración de reservas | 3 | Job/scheduler que llama `sp_V5_ExpirarReservas` |

## E8 — Pagos (Webpay simulado) `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E8.1 | Registrar pago | 5 | `sp_RegistrarPago`, UI |
| E8.2 | Pagar con Webpay simulado | 8 | `sp_WP_IniciarTransaccion`/`sp_WP_ConfirmarTransaccion`, UI flujo |
| E8.3 | Reembolsos | 5 | `sp_V5_CrearReembolso`, UI |
| E8.4 | Reporte de ingresos | 3 | `sp_V5_ReporteIngresosMensuales`, gráfico |

## E9 — Arriendos e inspecciones `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E9.1 | Iniciar arriendo (retiro) | 5 | `sp_IniciarArriendo`, UI operador |
| E9.2 | Registrar devolución | 8 | `sp_RegistrarDevolucion`, UI |
| E9.3 | Inspección entrega/devolución + daños | 8 | `InspeccionArriendo`, `sp_RegistrarDanoInspeccion`, fotos |
| E9.4 | Conductores adicionales | 3 | `sp_RegistrarConductorAdicional` |
| E9.5 | Aceptación de contrato | 3 | `sp_V5_CrearAceptacionContrato`, UI firma |

## E10 — Cargos extra, multas, disputas `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E10.1 | Crear cargo extra | 3 | `sp_CrearCargoExtra`, UI |
| E10.2 | Registrar multa | 3 | `sp_RegistrarMulta`, UI |
| E10.3 | Abrir/gestionar disputa | 5 | `Disputa`, UI |

## E11 — Liquidaciones y comisiones `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E11.1 | Generar liquidación por período | 5 | `sp_V5_GenerarLiquidacion`, UI admin |
| E11.2 | Aprobar/pagar liquidación | 3 | `sp_V5_AprobarLiquidacion`, `sp_V5_MarcarLiquidacionPagada` |
| E11.3 | Ver liquidaciones (proveedor) | 3 | `LiquidacionProveedor`, UI |

## E12 — Chat y notificaciones `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E12.1 | Conversar con proveedor/cliente | 8 | `sp_CrearConversacion`, `sp_EnviarMensaje`, `sp_ListarMensajes`, UI chat |
| E12.2 | Adjuntos en mensajes | 3 | `MensajeAdjunto`, upload |
| E12.3 | Notificaciones + worker outbox | 5 | `Notificacion`, `OutboxEvento`, worker, UI campana |

## E13 — Reseñas `S`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E13.1 | Crear reseña tras arriendo | 3 | `sp_CrearResena`, UI |
| E13.2 | Ver reseñas de vehículo/proveedor | 2 | `Resena`, UI |

## E14 — Paneles `M`
| ID | Historia | SP | Tareas |
|---|---|---|---|
| E14.1 | Panel cliente (reservas, pagos, chat) | 8 | Layout + widgets |
| E14.2 | Panel proveedor (vehículos, sedes, liquidaciones) | 8 | Layout + widgets |
| E14.3 | Panel admin (proveedores, catálogos, disputas, auditoría) | 8 | Layout + widgets |

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
