# Producción — Aplicación Web RentaCarDB

Documentación y planificación del desarrollo de la **aplicación web** (full‑stack) que
consume la base de datos `RentaCarDB`.

- **Stack:** Node.js + Express + TypeScript (API) · React + Vite + TypeScript (web) · SQL Server.
- **Despliegue:** Docker (local). Render opcional para la presentación.
- **Equipo:** 3 personas.
- **Entrega:** 17 de noviembre.

## Índice

| Documento | Contenido |
|---|---|
| [`PROMPT-MAESTRO.md`](PROMPT-MAESTRO.md) | **Prompt para una nueva sesión** del agente (contexto + qué hacer). |
| [`PLAN.md`](PLAN.md) | Visión, hitos y roadmap resumido. |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Stack, capas, diagramas y decisiones (ADR). |
| [`docs/API.md`](docs/API.md) | Contratos REST y mapeo a los SP de la base. |
| [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) | Enlace al modelo relacional de la BD. |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Épicas → historias → tareas con estimaciones. |
| [`docs/CRONOGRAMA.md`](docs/CRONOGRAMA.md) | Sprints y fechas (18‑oct → 17‑nov). |
| [`docs/EQUIPO.md`](docs/EQUIPO.md) | Roles y reparto de trabajo. |
| [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) | OWASP, auth, secretos, Ley 19.628. |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Entornos, Docker, CI/CD, Render. |
| [`docs/TESTING.md`](docs/TESTING.md) | Estrategia de pruebas. |
| [`docs/SKILLS.md`](docs/SKILLS.md) | Skills recomendadas (documentadas, no instaladas). |
| [`docs/COLABORACION.md`](docs/COLABORACION.md) | Repositorio, ramas, protección y flujo de trabajo en equipo. |

## Estructura de carpetas

```
Producción/
├─ README.md          # este archivo
├─ PLAN.md
├─ docs/              # documentación y planificación
├─ backend/           # API (Node/Express/TS)
├─ frontend/          # Web (React/Vite/TS)
├─ database/          # scripts y seeds de la BD
└─ infra/             # docker-compose, Dockerfiles, CI
```

## Cómo levantar (objetivo final)

```bash
docker compose -f infra/docker-compose.yml up --build
# API:  http://localhost:3000/api
# Web:  http://localhost:5173
# BD:   localhost:1433 (SQL Server)
```

> El código de `backend/`, `frontend/` e `infra/` se genera en las fases S0–S4 (ver `PLAN.md`).
