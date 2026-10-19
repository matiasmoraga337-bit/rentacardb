# Glosario de términos del dominio — RentaCarDB

Términos del negocio de **reserva y arriendo de vehículos** usados en el modelo.

## Actores
| Término | Definición |
|---------|-----------|
| **Persona** | Individuo con datos de identidad (RUT, nombres, contacto). Base de `Usuario`. |
| **Usuario** | Cuenta de acceso a la plataforma (email + contraseña). Toda persona que usa el sistema. |
| **Cliente** | Usuario habilitado para **reservar y arrendar** vehículos. |
| **Proveedor** | Dueño/gestor de vehículos que los publica en renta. Puede ser **persona** o **empresa**. |
| **Usuario de proveedor** | Usuario vinculado a un proveedor (operador o administrador) vía `ProveedorUsuario`. |
| **Sede** | Punto físico de un proveedor donde se entrega/recibe un vehículo (`SedeProveedor`). |

## Geografía (Chile)
| Término | Definición |
|---------|-----------|
| **Región** | Primera división territorial de Chile (16). |
| **Provincia** | Segunda división (56); pertenece a una región. |
| **Comuna** | Tercera división (346); pertenece a una provincia. |
| **Código de comuna** | Código oficial (CUT) de 5 dígitos de la comuna. |

## Vehículos
| Término | Definición |
|---------|-----------|
| **Vehículo** | Unidad concreta que se arrienda (patente, VIN, marca/modelo, año, km). |
| **Marca / Modelo** | Fabricante y versión del vehículo. |
| **Tipo de vehículo** | Categoría (Sedán, SUV, Hatchback, Pickup, Van, Coupé). |
| **Tipo de combustible** | Gasolina, Diésel, Híbrido, Eléctrico. |
| **Tipo de transmisión** | Manual o Automática. |
| **Estado del vehículo** | Disponible, Arrendado, En mantenimiento, Fuera de servicio. |
| **Estado de publicación** | Pendiente, Publicado, Rechazado, Suspendido. |
| **Característica** | Equipamiento del vehículo (GPS, aire acondicionado, silla de bebé…). Relación N:M. |
| **Tarifa** | Regla de precio por día según fecha, día de la semana, anticipación y duración. |
| **Documento de vehículo** | Permiso de circulación, revisión técnica, SOAP, seguro (con vencimiento). |
| **Mantenimiento** | Preventivo, correctivo, revisión técnica, lavado, otro. |
| **Movimiento de vehículo** | Traslado del vehículo entre sedes. |

## Reserva y arriendo
| Término | Definición |
|---------|-----------|
| **Reserva** | Solicitud de un cliente para usar un vehículo entre dos fechas, en sedes de retiro y devolución. |
| **Estado de reserva** | PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA, EXPIRADA. |
| **Transición de estado** | Regla que define qué cambios de estado de reserva son válidos y con qué evento/requisitos. |
| **Expiración de reserva** | Plazo (minutos) tras el cual una reserva no pagada pasa a EXPIRADA. |
| **Bloqueo de vehículo** | Intervalo en que el vehículo no está disponible (reserva, mantenimiento, traslado, manual, accidente, documentación). |
| **Snapshot de reserva** | Copia congelada de precios/condiciones al momento de reservar (trazabilidad). |
| **Arriendo** | Ejecución real de una reserva: retiro, uso y devolución del vehículo. |
| **Estado de arriendo** | ACTIVO, FINALIZADO, CANCELADO. |
| **Inspección** | Registro de entrega o devolución (combustible, km, limpieza, fotos, daños). |
| **Conductor adicional** | Persona extra autorizada a conducir el vehículo en el arriendo. |
| **Licencia de conducir** | Licencia del conductor, con clase y vigencia. |
| **Aceptación de contrato / términos** | Evidencia (hash, IP, versión) de que el cliente aceptó el contrato o los términos. |

## Pagos y finanzas
| Término | Definición |
|---------|-----------|
| **Pago** | Transacción monetaria asociada a una reserva, arriendo o cargo extra. |
| **Método de pago** | Débito, crédito, prepago, transferencia, efectivo, Webpay simulado. |
| **Estado de pago** | PENDIENTE, APROBADO, RECHAZADO, REEMBOLSADO. |
| **Tipo de operación de pago** | RESERVA, ARRIENDO, EXTRA. |
| **Movimiento financiero** | Asiento contable interno (cargo, comisión, reembolso, multa, depósito…). |
| **Comisión de plataforma** | Porcentaje que retiene la plataforma sobre el arriendo (global o por proveedor). |
| **Reembolso** | Devolución total o parcial del dinero pagado. |
| **Liquidación** | Cálculo periódico de lo que se paga a un proveedor (bruto − comisión − reembolsos + ajustes). |
| **Cargo extra** | Cobro adicional (combustible, km excedido, daño, limpieza, multa de tránsito). |
| **Multa** | Multa de tránsito asociada a un arriendo. |
| **Disputa** | Reclamo abierto entre cliente y proveedor por un arriendo. |
| **Pasarela simulada (Webpay)** | Emulación del flujo de pago Webpay (iniciar → `token_ws` → confirmar). |

## Comunicación y reputación
| Término | Definición |
|---------|-----------|
| **Conversación** | Hilo de mensajería entre un cliente y un proveedor (opcionalmente sobre un vehículo). |
| **Mensaje** | Texto/imagen/archivo/ubicación dentro de una conversación (soporta respuestas y edición). |
| **Adjunto de mensaje** | Archivo asociado a un mensaje. |
| **Notificación** | Aviso al usuario (EMAIL/SMS/PUSH) generado por eventos del sistema. |
| **Reseña** | Evaluación (1–5) de cliente a proveedor/vehículo o de proveedor a cliente. |
| **Favorito** | Vehículo marcado por un usuario como preferido. |
| **Búsqueda guardada** | Filtros de búsqueda que el usuario guarda para reutilizar. |

## Técnicos
| Término | Definición |
|---------|-----------|
| **Auditoría** | Registro de cambios relevantes (quién, cuándo, antes/después). |
| **Outbox** | Patrón de cola de eventos para integración asíncrona. |
| **Idempotencia** | `idempotency_key` que evita duplicar una operación si se reintenta. |
| **Correlación** | `correlation_id` que agrupa operaciones de un mismo flujo. |
| **Rowversion** | Columna de control de concurrencia optimista. |
| **Configuración global** | Parámetros de plataforma (IVA, comisión, expiración, moneda). |
