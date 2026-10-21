# RentaCarDB

Sistema web de reserva y arriendo de vehículos con múltiples proveedores y sedes por
región de Chile. Proyecto universitario de Base de Datos + aplicación web full‑stack.

- **Base de datos:** Microsoft SQL Server · base `RentaCarDB` (83 tablas, 113 FK, 69 SP, 3 funciones, 6 vistas).
- **API:** Node.js + Express + TypeScript · acceso a datos con `mssql` (llamando a los SPs).
- **Web:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui.
- **Despliegue:** Docker Compose (local). Render opcional para la demo.
- **Equipo:** 3 personas · **Entrega:** 17 de noviembre.

## Estructura del repositorio

```
rentacardb/
├─ AGENTS.md                 # reglas de trabajo del proyecto (leer primero)
├─ README.md                 # este archivo
├─ RentacarFinal.sql         # script canónico de la base de datos (autosuficiente)
├─ docs/                     # documentación del MODELO de datos
├─ sql/                      # scripts auxiliares de la BD (y legacy/)
├─ Producción/               # planificación y código de la aplicación web
│  ├─ backend/               # API (Node/Express/TS)
│  ├─ frontend/              # Web (React/Vite/TS)
│  ├─ database/              # scripts, init y seeds para Docker
│  ├─ infra/                 # docker-compose, Dockerfiles, CI
│  └─ docs/                  # API, BACKLOG, CRONOGRAMA, EQUIPO, SEGURIDAD, ...
└─ .github/                  # CI, plantillas de PR/issue, CODEOWNERS
```

## Requisitos

- Docker y Docker Compose.
- Node.js 20+ (para desarrollo local sin Docker).
- Acceso a una instancia de SQL Server (opcional si se usa el contenedor).

## Cómo levantar (objetivo)

```bash
cp .env.example .env
docker compose -f Producción/infra/docker-compose.yml up --build
# API:  http://localhost:3000/api
# Web:  http://localhost:5173
# BD:   localhost:1433 (SQL Server)
```

> `Producción/infra/` y los esqueletos de `backend/` y `frontend/` se generan en las
> fases S0–S4 (ver [`Producción/PLAN.md`](Producción/PLAN.md)).

## Documentación

- Modelo de datos: [`docs/README.md`](docs/README.md) · ERD: [`docs/06-ERD.md`](docs/06-ERD.md).
- Planificación de la app: [`Producción/README.md`](Producción/README.md).
- Contratos de la API: [`Producción/docs/API.md`](Producción/docs/API.md).

## Contribuir

- Ramas: `feat/…`, `fix/…`, `chore/…` (una por historia del backlog).
- Flujo: `feat/* → develop` (integración) y `develop → main` en cada hito/demo.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
- Todo PR requiere revisión de otra persona y CI en verde. Lee [`AGENTS.md`](AGENTS.md).
