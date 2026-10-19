# 03 — Normalización (3FN)

El modelo `RentaCarDB` está normalizado hasta **Tercera Forma Normal (3FN)**. Se aplican
además **desnormalizaciones controladas** (documentadas al final) para rendimiento o
trazabilidad.

---

## 1FN — Primera Forma Normal (valores atómicos, sin grupos repetidos)

**Regla:** cada celda contiene un valor atómico y no hay columnas multivaluadas ni grupos
repetidos.

Cómo se cumple:
- No existe ningún campo del tipo `"GPS,A/C,Bluetooth"`. Lo multivaluado se resuelve con
  **tablas hijas**:
  - Características del vehículo → `CaracteristicaVehiculo` + `VehiculoCaracteristica` (N:M).
  - Fotos → `VehiculoFoto` / `InspeccionFoto` (una fila por foto).
  - Teléfonos/emails por sede → una fila por `SedeProveedor`.
- Cada columna guarda **un solo dato** (fechas, montos, textos, IDs).

## 2FN — Segunda Forma Normal (sin dependencias parciales)

**Regla:** ya en 1FN, y ningún atributo no‑clave depende de **parte** de una clave
compuesta.

Cómo se cumple:
- Las tablas con **clave compuesta** son las asociativas, y **solo** contienen atributos
  que dependen de la combinación completa:
  - `VehiculoCaracteristica` (PK: vehículo + característica): `disponible`, `fecha_registro`
    dependen de **ambos**.
  - `UsuarioRol`, `ProveedorUsuario`, `VehiculoSede`, etc.: igual.
- El detalle descriptivo vive en su **propia tabla** (p. ej. el nombre de la característica
  está en `CaracteristicaVehiculo`, no en `VehiculoCaracteristica`).

## 3FN — Tercera Forma Normal (sin dependencias transitivas)

**Regla:** ya en 2FN, y ningún atributo no‑clave depende de otro atributo no‑clave
(no hay dependencias transitivas).

Cómo se cumple (ejemplos clave):
- **Geografía:** `Comuna` depende de `Provincia`, y `Provincia` de `Region`. `Comuna` **no**
  almacena `region`; se obtiene vía `Provincia` (Región→Provincia→Comuna). Evita la
  dependencia transitiva `Comuna → Provincia → Región`.
- **Vehículo:** la marca está en `Marca`; `Modelo` depende de `Marca`; `Vehiculo` referencia
  `Modelo`. No se repite `marca` en `Vehiculo`.
- **Precio:** las reglas de precio viven en `TarifaVehiculo`; en `Reserva` se guarda solo el
  **valor aplicado** (`precio_diario_aplicado_reserva`) como dato histórico, no el catálogo.
- **Estados/tipos:** todos los `Estado*` y `Tipo*` son catálogos; las tablas de negocio
  guardan solo la FK. No hay descripciones duplicadas.
- **Usuario/Persona:** los datos de identidad están en `Persona`; `Usuario` solo añade
  credenciales. No hay `nombre`/`rut` repetidos en `Usuario`.
- **Pago/Liquidación:** montos y porcentajes de comisión se calculan desde `Comision` /
  `ConfiguracionGlobal`; no se replican en cada tabla.

---

## Desnormalizaciones controladas (y por qué)

Se desnormaliza **a propósito** en pocos casos, priorizando rendimiento/trazabilidad. Son
**cacheos** o **copias históricas** con una fuente de verdad clara:

| Tabla.Columna | Tipo | Motivo | Fuente de verdad |
|---|---|---|---|
| `Vehiculo.calificacion_promedio_vehiculo` | Cache de agregado | Evita `AVG()` sobre `Resena` en cada listado | `Resena` |
| `Reserva.precio_diario_aplicado_reserva`, `monto_*`, `porcentaje_impuesto_aplicado_reserva` | Copia histórica | El precio/IVA del momento debe congelarse (no cambiar si sube la tarifa) | `TarifaVehiculo` / `ConfiguracionGlobal` |
| `ReservaSnapshot.*` | Copia congelada | Trazabilidad contractual (hash, condiciones) | `Reserva` + tarifas |
| `Conversacion.ultimo_mensaje_preview_conversacion`, `fecha_ultimo_mensaje` | Cache | Evita consultar el último `Mensaje` al listar chats | `Mensaje` |
| `Conversacion.vehiculo_conversacion_calc` | Columna calculada persistida | Permite `UNIQUE` sobre `ISNULL(vehiculo,0)` | `ID_vehiculo_conversacion` |
| `LiquidacionProveedor.total_*` | Agregados persistidos | Reporte inmutable del período liquidado | `MovimientoFinanciero` |
| `*.row_version_*` | Control de concurrencia | Optimistic locking (no es dato de negocio) | — |
| `MetodoPago 'WEBPAY_SIMULADO'`, `Reserva.monto_descuento_reserva` | Reserva para extensiones | Pago simulado y descuentos futuros (cupones retirados) | — |

Estas desnormalizaciones **no rompen 3FN** en el sentido de la fuente de verdad: son
duplicaciones **intencionales y documentadas**, no redundancias accidentales.

---

## Resumen

| Forma | Estado | Evidencia principal |
|---|---|---|
| 1FN | ✅ | Sin valores multivaluados; N:M con tablas asociativas |
| 2FN | ✅ | Asociativas con PK compuesta y atributos dependientes de toda la clave |
| 3FN | ✅ | Jerarquías (Región→Provincia→Comuna), catálogos de estados/tipos, sin dependencias transitivas |
| Desnormalización | ✅ controlada | Cacheos/históricos documentados en la tabla anterior |
