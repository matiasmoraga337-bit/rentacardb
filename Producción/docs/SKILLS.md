# SKILLS recomendadas (documentadas, NO instaladas)

Skills útiles para el desarrollo full‑stack. **No se instalaron**; aquí queda documentado
qué hace cada una y el comando para instalarla si se decide usarla.

> Recordatorio: las skills son instrucciones en Markdown que se cargan en el contexto del
> agente. Revisar antes de usar (se ejecutan con permisos del agente).

## Externas (skills.sh) — recomendadas

| Skill | Instalaciones | Para qué | Instalar |
|---|---|---|---|
| `wshobson/agents@nodejs-backend-patterns` | 48K | Patrones de backend Node/Express | `npx skills add wshobson/agents@nodejs-backend-patterns -g -y` |
| `jeffallan/claude-skills@devops-engineer` | 10.9K | DevOps, CI/CD, despliegue | `npx skills add jeffallan/claude-skills@devops-engineer -g -y` |
| `affaan-m/ecc@deployment-patterns` | 10.8K | Patrones de despliegue | `npx skills add affaan-m/ecc@deployment-patterns -g -y` |
| `jeffallan/claude-skills@fullstack-guardian` | 5.5K | Guía full‑stack integral | `npx skills add jeffallan/claude-skills@fullstack-guardian -g -y` |
| `sickn33/agentic-awesome-skills@react-nextjs-development` | 1.9K | React/Next.js | `npx skills add sickn33/agentic-awesome-skills@react-nextjs-development -g -y` |
| `alirezarezvani/claude-skills@senior-frontend` | 1.6K | Buenas prácticas frontend | `npx skills add alirezarezvani/claude-skills@senior-frontend -g -y` |
| `alirezarezvani/claude-skills@senior-backend` | 1.6K | Buenas prácticas backend | `npx skills add alirezarezvani/claude-skills@senior-backend -g -y` |

## Ya instaladas (usar sin instalar)

| Skill | Uso en el proyecto |
|---|---|
| `frontend-design` | Dirección visual y diseño de UI |
| `design-taste-frontend` | Evitar UI genérica/templated |
| `impeccable` | Auditoría y pulido de interfaz |
| `accessibility` | WCAG 2.2, navegación por teclado, screen readers |
| `web-design-guidelines` | Revisión de UI contra buenas prácticas |
| `design-principles` | SOLID/DRY/KISS en el diseño |
| `testing-strategy` | Estrategia de pruebas |
| `tdd` | Desarrollo guiado por tests |
| `security-and-hardening` | Endurecimiento de seguridad |
| `deployment-pipeline-design` | Diseño de pipeline CI/CD |
| `github-actions` | Workflows de GitHub Actions |
| `git-workflow-and-versioning` | Ramas, PRs, versionado |
| `domain-modeling` | Glosario/ADR del dominio |

## Uso por fase

| Fase | Skills sugeridas |
|---|---|
| Setup/infra (S0) | `deployment-pipeline-design`, `github-actions`, `devops-engineer` |
| Backend (S1–S2) | `nodejs-backend-patterns`, `senior-backend`, `security-and-hardening` |
| Frontend (S1–S3) | `frontend-design`, `design-taste-frontend`, `impeccable`, `accessibility`, `senior-frontend` |
| Testing (S2–S4) | `testing-strategy`, `tdd` |
| Cierre (S4) | `web-design-guidelines`, `security-and-hardening`, `git-workflow-and-versioning` |

## Gestión

```bash
npx skills list       # listar instaladas
npx skills update     # actualizar
```
