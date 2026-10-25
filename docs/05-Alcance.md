# 05 — Alcance del proyecto

Documento de **alcance, supuestos y límites** de `RentaCarDB` (proyecto universitario de
Base de Datos).

## 1) Descripción general
Sistema web de **reserva y arriendo de vehículos** con:
- Usuarios que se **registran, inician sesión y reservan/arriendan** un vehículo por día.
- **Múltiples proveedores (dueños)** que publican vehículos en renta.
- **Varias sedes** repartidas en distintas **regiones de Chile**.

## 2) Dentro del alcance (lo que el modelo SÍ cubre)

| Área | Incluido |
|---|---|
| Usuarios y seguridad | Registro, login, roles, verificación de correo, reseteo de contraseña, historial de login |
| Proveedores | Registro/aprobación de proveedores (persona o empresa), sedes por comuna |
| Geografía | Regiones, provincias y comunas de Chile (16 / 56 / 346) |
| Vehículos | Marca, modelo, tipo, combustible, transmisión, características (equipamiento), fotos, documentos, tarifas por día |
| Reservas | Solicitud por fechas, cálculo de precio/IVA, expiración, transiciones de estado, historial |
| Arriendos | Retiro y devolución reales, kilometraje, combustible, inspecciones (fotos y daños), conductores adicionales |
| Pagos | Pagos, métodos, estados, idempotencia, **pasarela simulada tipo Webpay** |
| Finanzas | Movimientos financieros, comisión de plataforma, reembolsos, liquidación a proveedores |
| Extras | Cargos extra, multas de tránsito, disputas |
| Comunicación | Mensajería cliente↔proveedor (con adjuntos) y notificaciones |
| Reputación | Reseñas, favoritos, búsquedas guardadas |
| Auditoría | Traza de cambios, outbox de eventos, snapshots de reserva |

## 3) Fuera del alcance (extensiones / simplificaciones)

| Tema | Decisión | Motivo |
|---|---|---|
| **Cupones / códigos de descuento** | **Retirados** (`Cupon`, `UsoCupon` eliminados) | Simplificar; `Reserva.monto_descuento_reserva` se conserva para futuros descuentos |
| **OAuth 2.0 / login con proveedor externo** | Fuera de alcance (documentado) | Es capa de aplicación; el modelo local (email+password) es suficiente |
| **Envío real de notificaciones (email/SMS/push)** | Fuera de alcance | La BD **encola/guarda**; el envío lo hace la app/worker (consume `OutboxEvento`) |
| **Pasarela de pago real (Transbank)** | Solo **simulada** | Sin integración productiva; se emula el flujo `token_ws` |
| **Job de expiración de reservas** | Tarea programada de la app | La edición SQL **Express no tiene SQL Server Agent** |
| **Pago con múltiples monedas** | Solo **CLP** | `CHECK` fija moneda CLP en pagos |
| **Multi‑país** | Solo **Chile** | Geografía acotada a regiones/provincias/comunas |
| **Cálculo de impuestos por región** | IVA único (global) | `ConfiguracionGlobal.iva_porcentaje` (19%) |
| **Facturación electrónica (SII)** | Fuera de alcance | Requiere integración tributaria externa |
| **App móvil / frontend** | Fuera de alcance de la BD | Este proyecto entrega el **modelo de datos** y su lógica |

## 4) Supuestos

- Motor: **Microsoft SQL Server 2022** (`COMPATIBILITY_LEVEL = 160`), base `RentaCarDB`; compatible con SQL Server 2025.
- Los montos se manejan en **pesos chilenos (CLP)** con `decimal` (sin centavos fraccionarios).
- Las fechas de reserva son por **día** (`date`); los instantes operativos usan `datetime2(0)`.
- Los proveedores deben estar **APROBADOS** y sus vehículos **PUBLICADOS** para poder reservar.
- Un vehículo no puede tener **dos reservas activas solapadas** (validado por SP + trigger).
- Las **bajas son lógicas** (`activo_*`, `fecha_baja_*`); no se borran filas con historial.

## 5) Límites conocidos

- **Concurrencia optimista** por `rowversion` en tablas críticas (no bloqueo pesimista global).
- La **comisión** se registra como movimiento financiero al completar el arriendo; la liquidación
  la agrega por período.
- Los datos de **ejemplo** (operativos) no vienen en el script de esquema; se pueden añadir aparte.
- El **audit** se genera por triggers sobre `Reserva` y `Pago` (no sobre todas las tablas).

## 6) Entregables

1. **Modelo relacional** (este directorio `docs/`): diccionario, relaciones, 3FN, clasificación, alcance y ERD.
2. **Script de creación** de la base (`estesiscript.sql` + complementos `sql/`).
3. **Lógica de negocio** en base de datos: 84 procedimientos, 3 funciones, 4 triggers, 6 vistas.
4. **Datos de referencia** sembrados: geografía de Chile y catálogos del dominio.
