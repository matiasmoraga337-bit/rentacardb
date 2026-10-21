# CRONOGRAMA

**Inicio:** 18 de octubre · **Entrega:** 17 de noviembre (≈ 4 semanas, 3 personas).
Cada sprint dura **1 semana** (lunes a domingo). Ceremonias: planning (lunes), daily (15 min),
review/retro (viernes).

## Vista general

| Sprint | Fechas | Foco | Hito |
|---|---|---|---|
| **S0** | 18–20 oct | Setup, Docker, esqueletos, auth base | H0: proyecto levanta |
| **S1** | 21–27 oct | Auth completo, geografía, vehículos, proveedores/sedes | H1: gestión de vehículos |
| **S2** | 28 oct–3 nov | Búsqueda, reservas, pagos | H2: reserva + pago |
| **S3** | 4–10 nov | Arriendos, inspecciones, paneles, chat, reseñas | H3: arriendo completo |
| **S4** | 11–16 nov | Liquidaciones, disputas, multas, testing, hardening, docs, demo | H4: extensión + QA |
| **Entrega** | **17 nov** | Presentación | — |

## S0 — 18–20 oct (setup)
- **Todos:** definir convenciones (ramas, commits), crear repos y tablero.
- **P3:** `docker-compose` (api+web+mssql), `.env.example`, resolver compat level SQL Server.
- **P1:** esqueleto backend (Express+TS), pool `mssql`, `/health`, lint/test.
- **P2:** esqueleto frontend (Vite+React+TS+Tailwind), router y layout base.
- **Meta:** `docker compose up` levanta todo; login mínimo funcional.

## S1 — 21–27 oct
- **P1:** auth completo (`u_sp_Login`, registro, JWT, roles), geografía.
- **P2:** UI de login/registro/perfil, catálogo de vehículos (lectura).
- **P3:** CRUD proveedores/sedes + endpoints de catálogos + CI.
- **Meta (H1):** un proveedor crea y publica un vehículo con fotos y tarifa.

## S2 — 28 oct–3 nov
- **P1:** búsqueda/disponibilidad, reservas (`u_sp_CrearReserva`), pagos + Webpay simulado.
- **P2:** flujo de búsqueda → detalle → checkout → pago.
- **P3:** validaciones, tests de API de reserva/pago, datos de ejemplo.
- **Meta (H2):** un cliente reserva y paga de punta a punta.

## S3 — 4–10 nov
- **P1:** arriendos (`u_sp_IniciarArriendo`, `u_sp_RegistrarDevolucion`), inspecciones, cargos.
- **P2:** paneles cliente/proveedor, chat, reseñas.
- **P3:** panel admin, notificaciones/worker outbox, tests de UI.
- **Meta (H3):** ciclo completo retiro → devolución → reseña; chat funcionando.

## S4 — 11–16 nov
- **P1:** liquidaciones, disputas, multas (extensión) + hardening.
- **P2:** pulido de UI, accesibilidad, estados de error/vacío, i18n.
- **P3:** testing integral, seguridad, documentación, datos de demo, guion de presentación.
- **Meta (H4):** app estable, documentada y con demo reproducible.

## 17 nov — Entrega
- Presentación con datos de ejemplo cargados y guion por rol.

## Reglas de trabajo
- **Rama por feature** (`feat/...`), PR revisado por otro integrante antes de merge.
- **`main` siempre desplegable.**
- Bloqueos/bloqueantes se reportan en el daily; re‑priorizar en el planning.
- Si el alcance aprieta: **congelar** lo `S` (E10–E13) el 10‑nov y asegurar lo `M`.
