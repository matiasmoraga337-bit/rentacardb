# 06 — Diagramas Entidad‑Relación (ERD)

Diagramas por **módulo** (más legibles que un único diagrama con las 82 tablas).

**Notación (crow's foot):**
- `||--o{` = **uno a muchos** (`#` en el uno · `∞` en el muchos).
- `||--||` = **uno a uno**.
- `}o--o{` = **muchos a muchos** (se implementa con tabla asociativa).

> La **FK siempre está en el lado `∞`** (hijo). Los nombres son las tablas reales.

---

## Módulo 1 — Geografía (Chile)

```mermaid
erDiagram
    Region      ||--o{ Provincia           : "tiene"
    Provincia   ||--o{ Comuna              : "tiene"
    Comuna      ||--o{ SedeProveedor       : "ubica"
    Comuna      ||--o{ VehiculoComuna      : "cubre"
    Vehiculo    ||--o{ VehiculoComuna      : "se ofrece en"
```

## Módulo 2 — Usuarios y seguridad

```mermaid
erDiagram
    Persona       ||--o| Usuario            : "es"
    Usuario       ||--o| Cliente            : "puede ser"
    Usuario       ||--o{ UsuarioRol         : "tiene"
    Rol           ||--o{ UsuarioRol         : "asignado a"
    Usuario       ||--o{ ProveedorUsuario   : "opera"
    Proveedor     ||--o{ ProveedorUsuario   : "tiene"
    Usuario       ||--o{ AceptacionTerminos : "acepta"
    Usuario       ||--o{ EmailVerificacion  : "verifica"
    Usuario       ||--o{ PasswordResetToken : "resetea"
    Usuario       ||--o{ LoginHistorial     : "registra"
    Persona       ||--o{ LicenciaConducir   : "posee"
```

## Módulo 3 — Proveedores y vehículos

```mermaid
erDiagram
    Proveedor        ||--o{ SedeProveedor           : "tiene"
    Proveedor        ||--|| ConfiguracionProveedor  : "configura"
    Proveedor        ||--o{ Vehiculo                : "publica"
    Proveedor        ||--o{ Comision                : "define"
    Marca            ||--o{ Modelo                  : "tiene"
    Modelo           ||--o{ Vehiculo                : "es"
    Vehiculo         ||--o{ VehiculoFoto            : "tiene"
    Vehiculo         ||--o{ TarifaVehiculo          : "tarifa"
    Vehiculo         ||--o{ VehiculoSede            : "disponible en"
    SedeProveedor    ||--o{ VehiculoSede            : "ofrece"
    Vehiculo         ||--o{ VehiculoCaracteristica  : "posee"
    CaracteristicaVehiculo ||--o{ VehiculoCaracteristica : "aplica a"
    Vehiculo         ||--o{ DocumentoVehiculo       : "tiene"
    Vehiculo         ||--o{ Mantenimiento           : "recibe"
```

## Módulo 4 — Reservas y arriendos

```mermaid
erDiagram
    Cliente         ||--o{ Reserva                    : "solicita"
    Vehiculo        ||--o{ Reserva                    : "se reserva"
    SedeProveedor   ||--o{ Reserva                    : "retiro/devolucion"
    EstadoReserva   ||--o{ Reserva                    : "estado actual"
    Reserva         ||--|| Arriendo                   : "se ejecuta"
    Reserva         ||--o{ HistorialEstadoReserva     : "historial"
    Reserva         ||--o{ BloqueoVehiculo            : "bloquea"
    Reserva         ||--o{ ReservaSnapshot            : "congela"
    EstadoReserva   ||--o{ TransicionEstadoReserva    : "origen/destino"
    Arriendo        ||--o{ InspeccionArriendo         : "inspecciona"
    InspeccionArriendo ||--o{ InspeccionDano          : "detecta"
    InspeccionArriendo ||--o{ InspeccionFoto          : "adjunta"
    Arriendo        ||--o{ ConductorAdicional         : "agrega"
    Arriendo        ||--o{ AceptacionContratoArriendo : "acepta"
```

## Módulo 5 — Pagos y finanzas

```mermaid
erDiagram
    Reserva           ||--o{ Pago                    : "paga"
    Arriendo          ||--o{ Pago                    : "cobra"
    Pago              ||--o{ MovimientoFinanciero    : "genera"
    Pago              ||--o| PagoTransaccionSimulada : "webpay"
    Reserva           ||--o{ Reembolso               : "reembolsa"
    Pago              ||--o{ Reembolso               : "origen"
    Arriendo          ||--o{ CargoExtra              : "cobra"
    TipoCargoExtra    ||--o{ CargoExtra              : "clasifica"
    Arriendo          ||--o{ Multa                   : "multa"
    Arriendo          ||--o{ Disputa                 : "disputa"
    Proveedor         ||--o{ LiquidacionProveedor    : "recibe"
```

## Módulo 6 — Comunicación y reputación

```mermaid
erDiagram
    Usuario     ||--o{ Conversacion      : "inicia"
    Proveedor   ||--o{ Conversacion      : "atiende"
    Vehiculo    ||--o{ Conversacion      : "sobre"
    Conversacion ||--o{ Mensaje          : "contiene"
    Mensaje     ||--o{ MensajeAdjunto    : "adjunta"
    Mensaje     ||--o{ Mensaje           : "responde"
    Usuario     ||--o{ Notificacion      : "recibe"
    Arriendo    ||--o{ Resena            : "evaluado"
    Usuario     ||--o{ FavoritoVehiculo  : "marca"
    Vehiculo    ||--o{ FavoritoVehiculo  : "marcado"
```

---

## Cómo dibujarlo en el Diseñador de MS‑SQL Server (SSMS)

1. En el **Explorador de objetos**, expande **Bases de datos → RentaCarDB**.
2. Clic derecho en **Diagramas de base de datos** → **Nuevo diagrama de base de datos**
   (si pregunta, acepta crear el soporte de diagramas).
3. En el panel **Tablas**, agrega las tablas del módulo que quieras (arrástralas al lienzo).
   - Sugerencia: dibuja **un diagrama por módulo** (como arriba) para que sea legible.
4. SSMS dibuja automáticamente las relaciones con **llave (`#`) en el lado uno** y
   **símbolo de infinito (`∞`) en el lado muchos**.
5. Verifica que cada línea tenga la llave en el lado **correcto** (el "uno") y el infinito en
   el lado con la FK (el "muchos").
6. Guarda con un nombre por módulo (p. ej. `ERD_Reservas`).

> Atajo: si prefieres dibujarlos desde cero, usa la vista de **Mermaid** de este documento y
> replica las mismas entidades/relaciones en el lienzo de SSMS.

## Verificación de cardinalidades
- [x] Llave (`#`) siempre en el lado **uno**.
- [x] Infinito (`∞`) siempre en el lado **muchos** (donde está la FK).
- [x] N:M representados con su **tabla asociativa** (no como línea directa).
- [x] 1:1 con `||--||` (PK=FK o `UNIQUE`).
