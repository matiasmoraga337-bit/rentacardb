# Demo S2 — Reservas + pagos (H2)

Guion reproducible para demostrar el flujo completo del Sprint S2.

## 1. Prerrequisitos

- Docker Desktop activo.
- `.env` raíz copiado de `.env.example` y completado con `DB_PASSWORD` y
  `JWT_SECRET` (no se versiona).
- `Producción/backend/.env` para ejecutar el seed/API fuera de Docker:
  `DB_HOST=localhost`, `DB_PORT=14330`, `DB_USER=sa`, `DB_DATABASE=RentaCarDB`,
  `DB_PASSWORD=...`, `JWT_SECRET=...`.
- La BD demo debe haberse creado con `RentacarFinal.sql` (compose lo hace en
  el primer arranque). El contenedor local antiguo `rentacar-sql` puede tener
  un esquema anterior; para S2 usar el `db` de compose o el contenedor de
  pruebas.

## 2. Levantar el entorno

```powershell
docker compose --env-file .env -p rentacardb-s2 -f "Producción/infra/docker-compose.yml" up -d --build
# API:     http://localhost:3000/api
# Web:     http://localhost:5173
# Mailpit: http://localhost:8026
# SQL:     localhost:14330
```

> Se usa el proyecto `rentacardb-s2` para partir de volúmenes nuevos
> (`rentacardb-s2_mssql-data` y `rentacardb-s2_uploads`) sin tocar el volumen
> anterior `rentacardb_mssql-data`. Si el stack ya está arriba, no repitas el
> comando. Para detenerlo: `docker compose --env-file .env -p rentacardb-s2 -f "Producción/infra/docker-compose.yml" down`.

Verificar:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

La verificación de S2 se hizo con este proyecto: `db-init` salió con código 0,
la API respondió `db: up`, la web respondió 200 y el smoke S2 terminó OK.

## 3. Cargar datos demo

```powershell
cd Producción/backend
npm install
$env:DB_PORT='14330'
npm run seed
```

El seed es idempotente. Crea:

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | `admin@rentacar.cl` | `Admin1234!` |
| CLIENTE | `demo@rentacar.cl` | `Demo1234!` |
| PROVEEDOR | `proveedor@rentacar.cl` | `Proveedor1234!` |

Datos: proveedor `AutoDemo`, sedes `Sede Santiago Centro` y
`Sede Providencia`, vehículos `DEMA01` (Toyota Corolla) y `DEMB02`
(Hyundai Tucson), tarifas, documentos verificados y filas `VehiculoSede`.

> Si registras un proveedor desde la UI de S1, cierra sesión y vuelve a
> iniciar sesión: el JWT conserva los roles con los que fue emitido hasta el
> siguiente login. El seed crea el usuario proveedor ya con su rol.

## 4. Guion de demo (cliente)

1. Abrir `http://localhost:5173/catalogo`.
2. Elegir fechas futuras (por ejemplo, dentro de 30 días) y buscar.
3. Abrir `DEMA01` y verificar la cotización y las sedes.
4. **Continuar al checkout** e iniciar sesión con `demo@rentacar.cl`.
5. Confirmar la reserva. Queda en estado `PENDIENTE`.
6. En la pantalla de pago, pulsar **Pagar con WebPay**.
7. En la pasarela simulada, **Aprobar pago**. La reserva pasa a
   `CONFIRMADA` y el pago a `APROBADO`.
8. Ir a **Mis reservas** y abrir el detalle.
9. Verificar historial (`CREAR`, `CANCELAR` cuando corresponda), snapshot y pago.
10. Cancelar la reserva. La previsualización muestra política `FLEXIBLE`,
    monto pagado y reembolso estimado. Confirmar cancelación.
11. Verificar que la reserva queda `CANCELADA` y el reembolso `COMPLETADO`.

## 5. Guion de demo (proveedor y admin)

- Proveedor: iniciar sesión con `proveedor@rentacar.cl`, abrir **Reservas** y
  verificar que solo aparecen reservas de sus vehículos.
- Admin: iniciar sesión con `admin@rentacar.cl`:
  - **Reportes** → ingresos mensuales del año.
  - `POST /api/admin/reservas/expirar` para ejecutar la expiración manual.
  - `POST /api/reservas/:id/cancelar` para cancelar con reembolso; el backend
    resuelve el cliente dueño y aplica la política.
  - `POST /api/reservas/:id/estado` para expirar o cancelar sin pago; si hay
    pago aprobado, deriva al flujo de cancelación con reembolso.

## 6. Casos límite para demostrar

| Caso | Cómo demostrarlo | Resultado esperado |
|---|---|---|
| Solapamiento | Repetir la reserva con fechas que se crucen | `409 RESERVA_SOLAPADA` |
| Idempotencia | Repetir `POST /reservas` con la misma `Idempotency-Key` | Misma reserva, sin duplicado |
| Pago rechazado | En WebPay simulado pulsar **Rechazar pago** | Pago `RECHAZADO`; reserva sigue `PENDIENTE` |
| Pago duplicado | Confirmar el mismo token dos veces | `409 TRANSACCION_YA_RESUELTA` |
| WebPay concurrente | Confirmar el mismo token en dos peticiones simultáneas | Un solo pago aprobado; la otra recibe `409` |
| Confirmar tras cancelar | Cancelar una reserva con pago pendiente y confirmar el token viejo | `409 RESERVA_NO_PENDIENTE` |
| Cancelación sin pago | Reserva `PENDIENTE` → cancelar | `CANCELADA`, sin reembolso |
| Cancelación con reembolso | Reserva `CONFIRMADA` → cancelar | `CANCELADA`, reembolso `COMPLETADO` |
| Expiración | Forzar fecha de expiración y ejecutar `POST /api/admin/reservas/expirar` | `EXPIRADA`, bloqueo liberado |
| Acceso ajeno | Cliente intenta abrir una reserva de otro | `403 FORBIDDEN` |
| Documentos | Vehículo sin documentos verificados | `409 DOCUMENTOS_VEHICULO_INVALIDOS` |

## 7. Smoke automático

Con la API y la BD levantadas:

```powershell
cd Producción/backend
$env:API_URL='http://localhost:3000/api'
npm run smoke:s2
```

El script hace login, busca, cotiza, reserva, prueba idempotencia y
solapamiento, inicia/confirma WebPay, prueba doble confirmación concurrente,
previsualiza y ejecuta la cancelación con reembolso. Termina con `SMOKE S2 OK`.

## 8. Evidencia para la rúbrica

- **Vista integrada:** `vw_ReservasDetalle` en `GET /reservas` y
  `GET /reservas/:id`; `vw_VehiculosDisponibles` en disponibilidad/búsqueda.
- **SPs integrados:** `u_sp_CrearReserva`, `u_sp_CancelarReserva`,
  `u_sp_WebPay_IniciarTransaccion`, `u_sp_WebPay_ConfirmarTransaccion`,
  `u_sp_RegistrarPago`, `u_sp_ExpirarReservas`.
- **Trigger y cursor:** ver `docs/JUSTIFICACION-TRIGGERS-CURSOR.md`.
- **Pruebas:** `sql/tests/05_reservas_pagos.sql` (30 casos),
  tests backend/frontend y smoke S2.
