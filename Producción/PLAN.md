# PLAN — Desarrollo de la aplicación web

## 1) Visión

Aplicación web full‑stack que expone el sistema **RentaCarDB**: reserva y arriendo de
vehículos con múltiples proveedores y sedes en distintas regiones de Chile.

**Objetivo:** una app funcional de punta a punta (registro → búsqueda → reserva → pago →
arriendo → devolución → reseña), con paneles de **cliente**, **proveedor** y **admin**, que
cubra **todo el modelo** (82 tablas), desplegable con Docker.

## 2) Alcance

- **Todo el modelo**: usuarios/roles, proveedores/sedes, vehículos/tarifas, reservas,
  arriendos, pagos (Webpay simulado), liquidaciones, cargos extra, multas, disputas, chat,
  reseñas, notificaciones.
- **Estrategia ante el plazo:** construir el **núcleo primero** (MVP) y luego las
  **extensiones** (chat, disputas, multas, liquidaciones). Si el tiempo aprieta, el MVP ya
  queda presentable.

## 3) Stack

| Capa | Tecnología |
|---|---|
| API | Node.js + Express + TypeScript |
| Datos | `mssql` (node-mssql) → **SPs** + queries de catálogos |
| Auth | JWT + bcrypt; roles desde `UsuarioRol` |
| Validación | zod |
| Web | React + Vite + TypeScript + React Router + TanStack Query |
| UI | Tailwind CSS + shadcn/ui + react-hook-form |
| Infra | Docker + docker-compose + GitHub Actions |

## 4) Hitos

| Hito | Fecha | Criterio |
|---|---|---|
| H0 — Proyecto levanta | 20 oct | `docker compose up` con API+Web+BD y login base |
| H1 — Gestión de vehículos | 27 oct | Proveedor crea/edita vehículos, sedes y tarifas |
| H2 — Reserva + pago | 3 nov | Cliente reserva y paga (Webpay simulado) |
| H3 — Arriendo completo | 10 nov | Retiro/devolución/inspección + paneles + chat |
| H4 — Extensiones + QA | 16 nov | Liquidaciones/disputas/multas + tests + docs |
| **Entrega** | **17 nov** | Presentación |

> **Estado (22-oct-2026):** H0, H1, H2, H3 y H4 completados y verificados. H4
> incluye cargos/multas, disputas, liquidaciones, notificaciones/outbox,
> fotos/adjuntos, hardening y demo. Ver `../docs/DEMO-S3.md`,
> `../docs/DEMO-S4.md` y `../docs/PRUEBAS-BD.md`.
> El CRUD de catálogos, mantenimiento, licencia, depósito y reportes quedó integrado en v1.2.5.

## 5) Roadmap por sprints (detalle en `docs/CRONOGRAMA.md`)

- **S0 (18–20 oct):** setup, docker, esqueletos, conexión a BD, auth base.
- **S1 (21–27 oct):** auth completo, geografía, vehículos, proveedores/sedes.
- **S2 (28 oct–3 nov):** búsqueda/disponibilidad, reservas, pagos.
- **S3 (4–10 nov):** arriendos, inspecciones, paneles, chat, reseñas.
- **S4 (11–16 nov):** liquidaciones, disputas, multas, testing, hardening, docs, demo.

## 6) Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Alcance grande vs. 4 semanas | Núcleo primero; extensiones como *stretch* |
| SQL Server en Docker (`COMPATIBILITY_LEVEL = 160`) | Usar imagen 2022; el canonical ya fija 160 |
| Integración con SPs | Documentar contratos en `docs/API.md` antes de codificar |
| Trabajo en equipo | Ramas por feature, PRs, tablero GitHub Projects |
| Falta de datos | Bloque de datos de ejemplo (seed) para demo |

## 7) Definición de "terminado" (DoD)

Una tarea está terminada cuando: código en `main` vía PR revisado · lint y tests pasan ·
endpoint/UI documentado · sin secretos en el repo · funciona en `docker compose`.
