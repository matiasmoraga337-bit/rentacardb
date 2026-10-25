# Defensa técnica — RentaCarDB

Guía común para que **todos los integrantes** puedan explicar la arquitectura,
el modelo, el flujo completo y los objetos SQL críticos. La asignación por
integrante es para liderar la respuesta, no para limitar el conocimiento.

## 1. Respuesta de arquitectura — 60 segundos

> “RentaCarDB es una aplicación full stack con tres capas: un frontend React +
> Vite + TypeScript, una API Express + TypeScript y SQL Server. El frontend solo
> consume la API; nunca se conecta a la base. La API usa el driver `mssql`,
> sentencias SQL explícitas y procedimientos almacenados, sin ORM. La
> autenticación es JWT con roles CLIENTE, PROVEEDOR, OPERADOR y ADMIN. La base
> tiene 83 tablas, 84 procedimientos, 6 vistas, 3 funciones y 4 triggers.”

## 2. Respuesta del flujo completo — 60 segundos

> “El cliente busca vehículos por fecha, región, comuna, tipo y precio. Elige
> uno, selecciona sede y crea una reserva. La reserva calcula precio, IVA,
> depósito y snapshot, y genera un evento en el outbox. Luego paga con WebPay
> simulado; al aprobarse, la reserva pasa a CONFIRMADA. El proveedor inicia el
> arriendo, registra la entrega, el cliente acepta el contrato y luego el
> proveedor registra la devolución con kilometraje, combustible, limpieza,
> cargos y daños. Finalmente el cliente deja una reseña del vehículo y del
> proveedor.”

## 3. Modelo mínimo que todos deben dominar

- `Usuario`, `Persona`, `Rol`, `UsuarioRol`.
- `Proveedor`, `SedeProveedor`, `Vehiculo`, `VehiculoSede`, `Modelo`, `Marca`.
- `Reserva`, `EstadoReserva`, `HistorialEstadoReserva`, `ReservaSnapshot`.
- `Pago`, `PagoTransaccionSimulada`, `Reembolso`, `MovimientoFinanciero`.
- `Arriendo`, `InspeccionArriendo`, `DanoInspeccion`, `ConductorAdicional`.
- `DocumentoVehiculo`, `Mantenimiento`, `LicenciaConducir`.
- `OutboxEvento`, `Notificacion`, `Auditoria`, `ErrorLog`.

**Respuesta literal:** “El núcleo es la reserva: conecta cliente, vehículo,
sede y fechas. El pago y el arriendo cuelgan de ella. Los movimientos
financieros registran cargos, pagos, comisiones, reembolsos y depósitos. El
outbox y la auditoría son transversales y se generan dentro de las mismas
transacciones.”

## 4. Objetos SQL que todos deben poder explicar

| Objeto | Qué debe decir |
|---|---|
| `u_sp_BuscarVehiculos` | “Filtra por fechas, región, comuna, tipo, precio y características. Devuelve `total_registros` y usa `OFFSET/FETCH` para paginar en servidor.” |
| `u_sp_CrearReserva` | “Valida cliente, vehículo, sedes, fechas y documentos; bloquea con `UPDLOCK/HOLDLOCK`; calcula precio con `fn_PrecioAplicable`; crea snapshot, movimientos y evento `ReservaCreada`; es idempotente por clave.” |
| `u_sp_WebPay_ConfirmarTransaccion` | “Confirma la transacción simulada de forma idempotente, valida estados y montos, actualiza pago y reserva, y publica el evento de confirmación.” |
| `u_sp_CancelarReserva` | “Valida propietario y estado, gestiona reembolso, cambia a CANCELADA, libera el depósito si corresponde y registra historial/auditoría.” |
| `u_sp_RegistrarDevolucion` | “Registra km, combustible, limpieza e inspección; calcula km excedido y cargos; actualiza el arriendo y el vehículo; genera movimientos y eventos.” |
| `u_sp_ExpirarReservas` | “Recorre reservas vencidas con cursor `FAST_FORWARD`, llama a `u_sp_CambiarEstadoReserva` y aísla errores por fila.” |
| `trg_Reserva_SinSolape` | “Impide reservas activas solapadas incluso si alguien inserta fuera de la API; es una invariante del modelo, no solo una validación de endpoint.” |
| `trg_Reserva_AfterUpdate_Auditoria` | “Registra cambios de estado con usuario, motivo y `correlation_id` desde `SESSION_CONTEXT`.” |
| `vw_ReservasDetalle` | “Simplifica el detalle de reservas uniendo cliente, vehículo, sede, estado y pago; se usa en listados y detalle.” |
| `vw_VehiculosDisponibles` | “Expone la flota publicada, aprobada y no dada de baja; se usa en búsqueda y disponibilidad.” |
| `fn_PrecioAplicable` | “Resuelve la tarifa vigente según fecha, prioridad y reglas del vehículo.” |
| `fn_ComisionAplicable` | “Calcula la comisión de plataforma según configuración global o del proveedor.” |

## 5. Preguntas y respuestas literales

### 1. ¿Qué construyeron?

> “Construimos RentaCarDB, una aplicación full stack de reserva y arriendo de
> vehículos con múltiples proveedores y sedes en Chile. Permite buscar,
> reservar, pagar, arrendar, devolver, calificar y administrar la operación.
> Está implementada con React, Express, TypeScript y SQL Server.”

### 2. ¿Por qué no usan un ORM?

> “Porque la rúbrica exige SQL explícito y verificable. Usamos el driver
> `mssql` solamente para conexión, parámetros y ejecución. Todo el SQL está
> escrito en repositorios y procedimientos almacenados; no hay generación
> automática que oculte las consultas.”

### 3. ¿Cómo evitan inyección SQL?

> “Todas las entradas van con `request.input(...)`, es decir, parámetros
> tipados. No concatenamos datos del usuario. En catálogos usamos nombres de
> tabla y columna desde un mapa estático y validado, nunca desde el body. Los
> errores de base se mapean a códigos de API sin exponer SQL.”

### 4. ¿Cómo protegen la integridad del modelo?

> “Con PK, FK, CHECK, UNIQUE, defaults, triggers y transacciones. Hay 116 FK,
> 94 CHECK y 54 UNIQUE. Las operaciones críticas usan transacción y
> `XACT_ABORT`; las bajas son lógicas y los triggers protegen invariantes como
> el solapamiento y la auditoría.”

### 5. ¿Cómo funciona la búsqueda y la paginación?

> “`u_sp_BuscarVehiculos` filtra por fechas, región, comuna, tipo, precio y
> características. Calcula `total_registros` con `COUNT(*) OVER()` y devuelve
> una página con `OFFSET/FETCH`. La API recibe `page` y `pageSize`, con tope de
> 100. El catálogo ya no descarga todos los vehículos.”

### 6. ¿Cómo se crea una reserva?

> “La API valida el body con Zod y llama a `u_sp_CrearReserva`. El SP abre
> transacción, bloquea el vehículo con `UPDLOCK/HOLDLOCK`, valida proveedor,
> documentos, sedes, fechas y reglas de duración, calcula precio e IVA, crea el
> snapshot, registra movimientos y publica `ReservaCreada` en el outbox. Si
> algo falla, revierte todo.”

### 7. ¿Cómo evitan dos reservas solapadas?

> “Hay dos capas. El SP usa `UPDLOCK/HOLDLOCK` para serializar la validación y
> el trigger `trg_Reserva_SinSolape` vuelve a comprobar `inserted` contra la
> tabla completa. El trigger cubre también inserciones directas o futuros SP;
> no es redundante, es una invariante de la base.”

### 8. ¿Cómo funciona el pago WebPay?

> “`u_sp_WebPay_IniciarTransaccion` crea un pago pendiente y un token simulado.
> La pantalla de confirmación llama a `u_sp_WebPay_ConfirmarTransaccion`, que
> valida token, monto y estado con bloqueo, evita doble confirmación, actualiza
> pago y reserva, y publica el evento. Rechazar deja el pago rechazado sin
> confirmar la reserva.”

### 9. ¿Cómo garantizan idempotencia?

> “Con claves únicas de idempotencia en reserva, pago y reembolso. Si llega un
> reintento con la misma clave, el SP devuelve el resultado existente o el
> error correspondiente, sin duplicar filas ni movimientos. Hay pruebas de
> doble confirmación y reintentos concurrentes.”

### 10. ¿Cómo se calculan precio, IVA, depósito y comisión?

> “`fn_PrecioAplicable` resuelve la tarifa vigente por fecha y prioridad.
> `ConfiguracionGlobal` aporta el IVA; `ConfiguracionProveedor` aporta duración,
> depósito y minutos de expiración. La comisión sale de `fn_ComisionAplicable`.
> El snapshot de la reserva guarda los valores calculados para que no cambien
> después.”

### 11. ¿Cómo funciona la devolución?

> “`u_sp_RegistrarDevolucion` recibe sede, km, combustible, limpieza y
> observaciones. Calcula km excedido según la política, registra inspección y
> cargos, actualiza el arriendo a FINALIZADO, libera el vehículo y genera
> movimientos y eventos. Los daños se registran después sobre la inspección de
> devolución.”

### 12. ¿Por qué usan un cursor?

> “Porque la expiración no es un simple `UPDATE`: por cada reserva hay que
> cambiar estado, cerrar bloqueo, escribir historial, auditoría y outbox, y
> aislar errores. `u_sp_ExpirarReservas` usa un cursor `LOCAL FAST_FORWARD`
> para reutilizar `u_sp_CambiarEstadoReserva` y registrar qué reserva falló. Si
> el volumen creciera, evaluaríamos un proceso set-based por lotes.”

### 13. ¿Por qué usan triggers si el SP ya valida?

> “Porque hay reglas que son invariantes del modelo, no del endpoint. El
> trigger protege aunque se inserte por otro SP, un job o una consola. En
> auditoría captura usuario y `correlation_id` desde `SESSION_CONTEXT` y deja
> evidencia aunque la API cambie.”

### 14. ¿Cómo funciona el outbox?

> “Los eventos se insertan en la misma transacción que el cambio de negocio.
> Un worker los toma con lock, envía correo o crea notificación, y los marca
> procesados o con error. Si falla, reintenta hasta el límite. Así no se pierde
> un evento si el correo o el proceso externo falla.”

### 15. ¿Cómo protegen la API?

> “JWT con bcrypt, middleware de autenticación y autorización por rol,
> validación Zod, Helmet, CORS restringido, rate limit en auth, errores
> mapeados, parámetros SQL y validación de archivos. Además nginx agrega
> gzip/cache y cabeceras de seguridad en producción.”

### 16. ¿Cómo prueban el sistema?

> “Tenemos 204 casos SQL, 143 tests de backend, 35 de frontend y 20 E2E con
> Playwright y axe. Los E2E cubren catálogo, login, admin, móvil y el flujo
> crítico completo: reserva, pago, arriendo, contrato, devolución y reseña.
> También hay smoke scripts para S2, S3, S4 y chat.”

### 17. ¿Qué mejorarían?

> “Agregaríamos observabilidad y métricas, más índices según consultas reales,
> procesamiento set-based para expiraciones masivas, pruebas de carga y
> eventualmente separar reportes en un modelo analítico. También completaríamos
> la QA física en dispositivos reales.”

### 18. ¿Qué parte fue la más compleja?

> “La consistencia de reservas, pagos, devoluciones y depósitos. Involucra
> transacciones, bloqueos, idempotencia, snapshot, triggers, outbox y auditoría.
> La dificultad no fue solo insertar filas, sino mantener el estado y el dinero
> consistentes ante reintentos y concurrencia.”

## 6. Guion de demo — 10 a 12 minutos

1. **Admin (1 min):** `/panel`, métricas, pagos pendientes, vehículos publicados.
2. **Catálogo (2 min):** filtro por región, ficha, galería y disponibilidad.
3. **Reserva y pago (3 min):** fechas, sede, crear reserva, WebPay aprobado.
4. **Proveedor (3 min):** iniciar arriendo, contrato, devolución.
5. **Cliente (1 min):** reseña del vehículo.
6. **Admin (2 min):** reportes, integridad, outbox y auditoría.

Antes de la demo: `npm run seed`, `npm run seed:fotos` y verificar `/api/health`.
Tener capturas o video de respaldo por si falla la red.

## 7. Reparto equitativo

| Integrante | Lidera | También debe responder |
|---|---|---|
| A | Modelo, triggers, auditoría | Reserva, pago, frontend |
| B | Reservas, pagos, transacciones | Devolución, vistas, frontend |
| C | Frontend, API, seguridad, pruebas | Trigger, cursor, modelo |

Nadie debe decir “eso lo hizo otro”. Si un integrante se bloquea, otro debe
continuar la explicación y la demo.

## 8. Ejercicios de modificación en vivo

- Agregar un filtro `precio_minimo` a `u_sp_BuscarVehiculos`.
- Agregar una validación de fecha en `u_sp_CrearReserva`.
- Cambiar un `JOIN` de `vw_ReservasDetalle` y explicar el resultado.
- Agregar una columna a `u_sp_ReporteProveedores`.
- Cambiar una condición de `trg_Reserva_SinSolape` y explicar el impacto.
- Agregar un parámetro opcional a `u_sp_ExpirarReservas`.

## 9. Checklist individual

- [ ] Explico la arquitectura sin mirar notas.
- [ ] Explico el flujo completo en menos de 2 minutos.
- [ ] Explico los 12 objetos SQL de la sección 4.
- [ ] Explico el trigger de solapamiento y el de auditoría.
- [ ] Explico el cursor y su alternativa set-based.
- [ ] Explico transacciones e idempotencia.
- [ ] Explico cómo se protege la API.
- [ ] Explico las pruebas y sus resultados.
- [ ] Realizo una modificación SQL en vivo.
- [ ] Puedo continuar la demo si otro integrante se bloquea.

## 10. Plan B

- Si falla la API: usar `npm run smoke:s2` o `smoke:s3` y mostrar la suite SQL.
- Si falla WebPay: mostrar captura del flujo y el test E2E.
- Si falla el correo: mostrar Mailpit o el outbox en admin.
- Si falla el mapa: usar el selector de región.
- Si falla la red: tener video corto de la demo y capturas de los reportes.
