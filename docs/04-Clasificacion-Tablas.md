# 04 — Clasificación de tablas

Las **82 tablas** de `RentaCarDB` se clasifican en cinco grupos según su rol en el proceso
comercial:

1. **Maestras / referencia (catálogos):** información relativamente estable que describe el
   dominio. Casi no cambian y se siembran una vez.
2. **Maestras de entidad / activos:** entidades principales del negocio (personas, usuarios,
   proveedores, vehículos) que evolucionan lentamente.
3. **Transaccionales:** registran **operaciones, movimientos o hechos** del proceso (reservar,
   arrendar, pagar, inspeccionar…). Crecen constantemente.
4. **Asociativas (N:M):** resuelven relaciones muchos‑a‑muchos entre dos entidades.
5. **Técnicas / infraestructura:** soporte de la plataforma (auditoría, eventos, seguridad),
   no del negocio en sí.

---

## 1) Maestras / referencia — catálogos (30)

| Tabla | Qué describe |
|---|---|
| `EstadoVehiculo` | Estados del vehículo (disponible, arrendado…) |
| `EstadoPublicacionVehiculo` | Estados de publicación (pendiente, publicado…) |
| `EstadoProveedor` | Estados del proveedor (pendiente, aprobado…) |
| `EstadoReserva` | Estados de la reserva |
| `EstadoArriendo` | Estados del arriendo |
| `EstadoPago` | Estados del pago |
| `EstadoCargoExtra` | Estados del cargo extra |
| `EstadoMulta` | Estados de la multa |
| `EstadoDisputa` | Estados de la disputa |
| `EstadoLiquidacion` | Estados de la liquidación |
| `TipoVehiculo` | Categoría del vehículo (sedán, SUV…) |
| `TipoCombustible` | Gasolina, diésel, híbrido, eléctrico |
| `TipoTransmision` | Manual / automática |
| `TipoProveedor` | Persona / empresa |
| `TipoOperacionPago` | Reserva / arriendo / extra |
| `MetodoPago` | Débito, crédito, transferencia… |
| `TipoDocumentoVehiculo` | Permiso, revisión técnica, SOAP, seguro |
| `TipoMantenimiento` | Preventivo, correctivo… |
| `TipoResena` | Cliente↔proveedor/vehículo |
| `TipoCargoExtra` | Combustible, km excedido, daño… |
| `CaracteristicaVehiculo` | Equipamiento (GPS, A/C…) |
| `ClaseLicencia` | Clases A1…F, B |
| `Marca` | Fabricante del vehículo |
| `Modelo` | Modelo (depende de marca) |
| `Region` | Regiones de Chile (16) |
| `Provincia` | Provincias (56) |
| `Comuna` | Comunas (346) |
| `Rol` | Roles del sistema |
| `PoliticaCancelacion` | Políticas de cancelación/reembolso |
| `TransicionEstadoReserva` | Reglas de transición de estados de reserva |

## 2) Maestras de entidad / activos (9)

| Tabla | Qué representa |
|---|---|
| `Persona` | Identidad de las personas (RUT, nombres) |
| `Usuario` | Cuenta de acceso (credenciales) |
| `Cliente` | Rol de cliente (habilita reservar) |
| `Proveedor` | Dueño/gestor de vehículos |
| `SedeProveedor` | Punto físico de un proveedor |
| `Vehiculo` | Unidad arrendable |
| `ConfiguracionProveedor` | Parámetros operativos del proveedor (1:1) |
| `Comision` | Porcentaje de comisión (global o por proveedor) |
| `TarifaVehiculo` | Reglas de precio por día |

## 3) Transaccionales / de movimiento (29)

| Tabla | Qué registra |
|---|---|
| `Reserva` | Solicitud de arriendo entre fechas |
| `Arriendo` | Ejecución real de la reserva |
| `Pago` | Transacción monetaria |
| `Reembolso` | Devolución de dinero |
| `MovimientoFinanciero` | Asiento contable (cargo, comisión, multa…) |
| `CargoExtra` | Cobro adicional |
| `Multa` | Multa de tránsito |
| `Disputa` | Reclamo de un arriendo |
| `Resena` | Evaluación de un arriendo |
| `LiquidacionProveedor` | Liquidación periódica a un proveedor |
| `PagoTransaccionSimulada` | Transacción Webpay simulada |
| `InspeccionArriendo` | Inspección de entrega/devolución |
| `InspeccionDano` | Daño detectado en la inspección |
| `InspeccionFoto` | Fotos de la inspección |
| `ConductorAdicional` | Conductor extra del arriendo |
| `Mantenimiento` | Servicio de mantenimiento |
| `MovimientoVehiculo` | Traslado entre sedes |
| `BloqueoVehiculo` | Intervalo de no disponibilidad |
| `DocumentoVehiculo` | Documento legal del vehículo |
| `LicenciaConducir` | Licencia de un conductor |
| `AceptacionContratoArriendo` | Evidencia de aceptación del contrato |
| `AceptacionTerminos` | Evidencia de aceptación de términos |
| `HistorialEstadoReserva` | Bitácora de cambios de estado |
| `ReservaSnapshot` | Copia congelada de condiciones |
| `VehiculoFoto` | Fotografías del vehículo |
| `Conversacion` | Hilo de mensajería |
| `Mensaje` | Mensaje de una conversación |
| `MensajeAdjunto` | Adjunto de un mensaje |
| `Notificacion` | Aviso generado por el sistema |

## 4) Asociativas (N:M) (6)

| Tabla | Relaciona |
|---|---|
| `UsuarioRol` | Usuario ↔ Rol |
| `ProveedorUsuario` | Proveedor ↔ Usuario |
| `FavoritoVehiculo` | Usuario ↔ Vehiculo |
| `VehiculoComuna` | Vehiculo ↔ Comuna |
| `VehiculoSede` | Vehiculo ↔ SedeProveedor |
| `VehiculoCaracteristica` | Vehiculo ↔ CaracteristicaVehiculo |

## 5) Técnicas / infraestructura (8)

| Tabla | Rol |
|---|---|
| `Auditoria` | Traza de cambios |
| `OutboxEvento` | Cola de eventos (integración asíncrona) |
| `LoginHistorial` | Registro de inicios de sesión |
| `EmailVerificacion` | Tokens de verificación de correo |
| `PasswordResetToken` | Tokens de reseteo de contraseña |
| `BusquedaGuardada` | Búsquedas guardadas por el usuario |
| `MigracionLog` | Registro de migraciones |
| `ConfiguracionGlobal` | Parámetros de la plataforma (fila única) |

---

## Resumen

| Clasificación | Cantidad |
|---|---|
| Maestras / referencia (catálogos) | 30 |
| Maestras de entidad / activos | 9 |
| Transaccionales | 29 |
| Asociativas (N:M) | 6 |
| Técnicas / infraestructura | 8 |
| **Total** | **82** |

> **Regla práctica:** las **maestras** se siembran y casi no cambian; las **transaccionales**
> crecen con cada operación y son el objeto de la mayoría de reportes; las **asociativas**
> solo existen para modelar un N:M; las **técnicas** sirven a la plataforma, no al negocio.
