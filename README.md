# RentaCarDB

Sistema web de reserva y arriendo de vehículos con múltiples proveedores y sedes por
región de Chile. Proyecto universitario de Base de Datos + aplicación web full‑stack.

- **Base de datos:** Microsoft SQL Server · base `RentaCarDB` (83 tablas, 113 FK, 84 SP, 3 funciones, 6 vistas).
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
docker compose --env-file .env -f Producción/infra/docker-compose.yml up --build
# API:  http://localhost:3000/api
# Web:  http://localhost:5173
# BD:   localhost:14330 (SQL Server en Docker)
```

> `Producción/infra/` y los esqueletos de `backend/` y `frontend/` se generan en las
> fases S0–S4 (ver [`Producción/PLAN.md`](Producción/PLAN.md)).

## Estado actual

- **S0/H0:** proyecto levanta + login.
- **S1/H1:** auth, catálogos, proveedores/sedes y vehículos.
- **S2/H2:** búsqueda con fechas, reservas, pago WebPay simulado, cancelación con
  reembolso, panel de proveedor y reporte de ingresos.
- **S3/H3:** arriendos, inspecciones, devolución, contrato, conductores
  adicionales, daños, chat, reseñas y paneles por rol.
- **S4/H4:** cargos extra, multas, disputas, liquidaciones, notificaciones,
  worker outbox, fotos de inspección y adjuntos de chat.

Guiones: [`docs/DEMO-S2.md`](docs/DEMO-S2.md) · [`docs/DEMO-S3.md`](docs/DEMO-S3.md) · [`docs/DEMO-S4.md`](docs/DEMO-S4.md).
Manual de usuario: [`docs/MANUAL-USUARIO.md`](docs/MANUAL-USUARIO.md).

## Documentación

- Modelo de datos: [`docs/README.md`](docs/README.md) · ERD: [`docs/06-ERD.md`](docs/06-ERD.md).
- Planificación de la app: [`Producción/README.md`](Producción/README.md).
- Contratos de la API: [`Producción/docs/API.md`](Producción/docs/API.md).
- S2 (reservas/pagos, SQL y seguridad): [`docs/RESERVAS-PAGOS.md`](docs/RESERVAS-PAGOS.md).
- S3 (arriendos e inspecciones): [`docs/ARRIENDOS.md`](docs/ARRIENDOS.md).
- Chat: [`docs/CHAT.md`](docs/CHAT.md).
- Reseñas: [`docs/RESENAS.md`](docs/RESENAS.md).
- Paneles por rol: [`docs/PANELES.md`](docs/PANELES.md).
- Cargos extra y multas: [`docs/CARGOS-MULTAS.md`](docs/CARGOS-MULTAS.md).
- Disputas: [`docs/DISPUTAS.md`](docs/DISPUTAS.md).
- Liquidaciones: [`docs/LIQUIDACIONES.md`](docs/LIQUIDACIONES.md).
- Notificaciones y outbox: [`docs/NOTIFICACIONES.md`](docs/NOTIFICACIONES.md).
- Adjuntos y fotos: [`docs/ADJUNTOS-FOTOS.md`](docs/ADJUNTOS-FOTOS.md).
- Catalogos: [`docs/CATALOGOS.md`](docs/CATALOGOS.md).
- Favoritos y busquedas: [`docs/FAVORITOS-BUSQUEDAS.md`](docs/FAVORITOS-BUSQUEDAS.md).
- Triggers y cursor: [`docs/JUSTIFICACION-TRIGGERS-CURSOR.md`](docs/JUSTIFICACION-TRIGGERS-CURSOR.md).
- Pruebas de BD: [`docs/PRUEBAS-BD.md`](docs/PRUEBAS-BD.md).
- Objetos SQL integrados: [`docs/OBJETOS-SQL.md`](docs/OBJETOS-SQL.md).
- QA física: [`docs/QA-FISICA.md`](docs/QA-FISICA.md).
- Defensa técnica: [`docs/DEFENSA-TECNICA.md`](docs/DEFENSA-TECNICA.md).
- Cuentas y datos de prueba: [`docs/CUENTAS-PRUEBA.md`](docs/CUENTAS-PRUEBA.md).

## Contribuir

- Ramas: `feat/…`, `fix/…`, `chore/…` (una por historia del backlog).
- Flujo: `feat/* → develop` (integración) y `develop → main` en cada hito/demo.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
- Todo PR requiere revisión de otra persona y CI en verde. Lee [`AGENTS.md`](AGENTS.md).
