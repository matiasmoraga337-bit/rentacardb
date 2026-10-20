# ARQUITECTURA

## 1) Visión general

```
┌────────────────────┐        HTTP/JSON        ┌────────────────────┐        TDS         ┌──────────────┐
│  Frontend (React)  │  ───────────────────▶   │  API (Node/Express)│  ───────────────▶  │  SQL Server  │
│  Vite + TS + TW    │  ◀───────────────────   │  TS + mssql        │  ◀───────────────  │  RentaCarDB  │
└────────────────────┘                         └────────────────────┘                    └──────────────┘
        SPA                                            REST + JWT                              SPs / tablas
```

- **Frontend (SPA)** consume la **API REST** con JWT.
- **API** valida, aplica reglas de negocio y **delega en los SPs** de la base (que ya contienen
  la lógica: crear reserva, pagar, devolver, liquidar, etc.).
- **Base de datos**: `RentaCarDB` (ver `../docs/`).

## 2) Backend — capas

```
src/
├─ routes/        # define endpoints y middlewares
├─ controllers/   # parsean request, llaman services, responden
├─ services/      # reglas de negocio y orquestación
├─ repositories/  # llamadas a SPs / queries (mssql)
├─ middlewares/   # auth, roles, validación (zod), errores, logging
├─ schemas/       # zod (compartidos con el frontend si aplica)
├─ config/        # env, db pool, swagger
└─ utils/         # helpers (jwt, hash, fechas, errores)
```

- **Flujo:** `route → middleware → controller → service → repository → SP/tabla`.
- **Errores:** clase `AppError` + middleware central → respuesta JSON uniforme
  `{ error: { code, message, details } }`.
- **Auth:** middleware `authenticate` (JWT) y `authorize(roles)` (lee `UsuarioRol`).
- **Idempotencia:** se propaga `idempotency_key` a los SPs que la soportan (reserva, pago, reembolso).
- **Correlación:** se genera `correlation_id` por request y se pasa a los SPs (auditoría).

## 3) Acceso a datos (mssql)

- Pool único de conexiones (`mssql.ConnectionPool`) reutilizado por request.
- **Repositorios** encapsulan cada SP: `sp_V5_CrearReserva`, `sp_RegistrarPago`,
  `sp_IniciarArriendo`, `sp_RegistrarDevolucion`, `sp_V5_CancelarReserva`, `sp_WP_*`, etc.
- Para catálogos y lecturas simples se usan **queries parametrizadas** (nunca SQL concatenado).
- **Transacciones**: se respetan las que abren los SPs (`@gestionar_transaccion`).

## 4) Frontend — estructura

```
src/
├─ app/           # router, layouts, providers (QueryClient, Auth)
├─ features/      # por dominio: auth, vehiculos, reservas, pagos, chat, admin...
│  └─ <feature>/  # components/, hooks/, api.ts, schemas.ts
├─ components/    # UI reutilizable (design system)
├─ lib/           # axios/fetch wrapper, utils, formatters
├─ hooks/         # hooks compartidos
└─ styles/        # tailwind + tokens
```

- **Estado servidor:** TanStack Query (cache, reintentos, invalidación).
- **Estado UI:** Zustand/Context (sesión, tema, filtros).
- **Formularios:** react-hook-form + zod (mismo schema que el backend cuando aplique).
- **Rutas protegidas:** guards por rol (CLIENTE, PROVEEDOR, OPERADOR, ADMIN).

## 5) Decisiones (ADR resumidas)

| # | Decisión | Motivo |
|---|---|---|
| 1 | **mssql + SPs** en vez de ORM | La lógica ya está en 70 SPs; evita duplicar reglas y mantiene integridad |
| 2 | **Express** (no NestJS) | Curva de aprendizaje menor; suficiente para el alcance |
| 3 | **JWT stateless** | Simple para SPA; roles en el token + verificación en BD |
| 4 | **TanStack Query** | Manejo de cache/estados de carga sin boilerplate |
| 5 | **Tailwind + shadcn/ui** | Velocidad de UI y consistencia visual |
| 6 | **Docker Compose** | Reproducibilidad del entorno (API+Web+BD) |
| 7 | **zod compartido** | Validación única FE/BE |

## 6) Convenciones

- **API:** prefijo `/api`, versionado por cabecera o `/api/v1` (decidir en S0).
- **Nombres:** `camelCase` en JSON, `PascalCase`/`snake_case` internos de BD se mapean en el repositorio.
- **Ramas git:** `feat/…`, `fix/…`, `chore/…`; PR obligatorio; `main` protegida.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`…).
