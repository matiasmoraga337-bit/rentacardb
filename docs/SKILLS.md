# Skills del proyecto — RentaCarDB

Documentación de las skills (asistentes especializados) instaladas para este
proyecto universitario de Base de Datos (SQL Server 2025 / `RentaCarDB`).

> Las skills son instrucciones en Markdown que se cargan en el contexto del
> agente. Se ejecutan con permisos plenos del agente: **revisar antes de usar**.

## Instaladas en esta sesión

Instaladas a nivel global en `~/.agents/skills/` (Windows:
`C:\Users\matia\.agents\skills\`).

| Skill | Fuente | Instalaciones | Riesgo (skills.sh) | Rol en el proyecto |
|-------|--------|---------------|--------------------|--------------------|
| `database-schema-designer` | `softaworks/agent-toolkit` | 4.3K | Safe / 0 alerts / Low | Diseño de esquema, normalización 3FN, índices, constraints, migraciones reversibles |
| `sql-pro` | `jeffallan/claude-skills` | 6.3K | ⚠ Gen "Critical" / Socket 0 alerts / Snyk Low | Optimización de consultas, CTEs, window functions, planes de ejecución, índices covering |

### Comandos de instalación

```bash
npx skills add softaworks/agent-toolkit@database-schema-designer -g -y
npx skills add jeffallan/claude-skills@sql-pro -g -y
```

### Notas de seguridad

- **`sql-pro`**: el CLI lo marcó como "Critical Risk" por el motor *Gen*, pero
  *Socket* reportó `0 alerts` y *Snyk* `Low Risk`. Se revisó el contenido
  (`SKILL.md` + `references/*.md`): son **solo instrucciones en Markdown**, sin
  scripts ejecutables, binarios ni hooks. Se considera apto; aun así se
  recomienda revisarlo periódicamente.
- **`database-schema-designer`**: contenido revisado (`SKILL.md`,
  `references/schema-design-checklist.md`, `assets/templates/migration-template.sql`),
  sin código ejecutable.
- El mensaje `PromptScript does not support global skill installation` es
  benigno: se refiere a un destino secundario de instalación; la skill igual se
  copió correctamente a `~/.agents/skills/`.

## Skills ya disponibles y relevantes

| Skill | Uso en este proyecto |
|-------|----------------------|
| `domain-modeling` | Glosario (`GLOSSARY.md`) y ADRs del dominio renta de vehículos; alinea nombres de entidades con el lenguaje del negocio |
| `design-principles` | SOLID/DRY/KISS aplicado al diseño de tablas y SP |
| `codebase-design` | Vocabulario de interfaces profundas; útil al documentar el modelo |

## Cómo usarlas en las fases del plan

| Fase del proyecto | Skill sugerida |
|-------------------|----------------|
| Diseño/normalización de nuevas tablas (`CaracteristicaVehiculo`, `TipoCargoExtra`, `ConfiguracionGlobal`, `Provincia`) | `database-schema-designer` |
| Índices sobre FK y optimización de vistas/SP de reportería | `sql-pro` + `database-schema-designer` |
| `docs/Alcance.md`, `docs/ModeloRelacional.md` | `domain-modeling` |
| Redacción de migraciones reversibles del script maestro | `database-schema-designer` |

## Reinstalar / actualizar

```bash
npx skills update      # actualiza todas las skills instaladas
npx skills list        # lista las skills instaladas
```
