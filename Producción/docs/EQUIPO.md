# EQUIPO — Roles y reparto

Equipo de **3 personas** (P1, P2, P3). Todos hacen PRs y participan en las ceremonias.

## Roles

| Rol | Persona | Responsabilidad principal |
|---|---|---|
| **Backend lead** | **P1** | API, integración con SPs, auth, pagos, lógica de negocio |
| **Frontend lead** | **P2** | UI/UX, design system, flujos de reserva/pago, accesibilidad |
| **DevOps + DB + full‑stack** | **P3** | Docker/CI, base de datos, tests, apoyo en módulos y documentación |

> Nombres reales: _(completar con el equipo)_.

## Reparto por épica

| Épica | P1 | P2 | P3 |
|---|---|---|---|
| E1 Infraestructura | apoyo | apoyo | **lead** |
| E2 Auth/usuarios | **lead** | UI | apoyo |
| E3 Geografía/catálogos | API | UI | **lead** |
| E4 Proveedores/sedes | **lead** | UI | apoyo |
| E5 Vehículos | **lead** | UI | apoyo |
| E6 Búsqueda/disponibilidad | **lead** | UI | apoyo |
| E7 Reservas | **lead** | UI | tests |
| E8 Pagos/Webpay | **lead** | UI | tests |
| E9 Arriendos/inspecciones | **lead** | UI | apoyo |
| E10 Cargos/multas/disputas | **lead** | UI | apoyo |
| E11 Liquidaciones | **lead** | UI | apoyo |
| E12 Chat/notificaciones | apoyo | **lead UI** | worker |
| E13 Reseñas | API | **lead UI** | apoyo |
| E14 Paneles | apoyo | **lead** | apoyo |
| E15 Testing/seguridad/docs | apoyo | apoyo | **lead** |
| E16 Despliegue/demo | apoyo | apoyo | **lead** |

## Acuerdos de equipo

- **Propiedad de código:** cada PR lo revisa al menos una persona distinta al autor.
- **Diario (daily):** qué hice, qué haré, bloqueos.
- **Pairing:** ante un bloqueo > 1 hora, pedir ayuda (evitar cuellos de botella).
- **Definición de terminado (DoD):** ver `../PLAN.md`.
- **Ramas:** `feat/<epica>-<descripcion>`; PR hacia `main` con descripción y capturas.
- **Tablero:** GitHub Projects con columnas Backlog / Todo / In Progress / Review / Done.

## Comunicación

- Canal del equipo (WhatsApp/Discord) para coordinación diaria.
- Issues/PRs en GitHub para decisiones y revisiones técnicas.
- Reunión de planning (lunes) y retro (viernes).

## Riesgos de equipo

- **Dependencia de P1 (backend):** P2/P3 pueden desbloquearse con **mocks** de API y con
  endpoints de catálogos que P3 puede adelantar.
- **Cuello de botella en UI:** P3 apoya en componentes compartidos cuando termine infra.
