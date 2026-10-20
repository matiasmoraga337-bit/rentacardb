# COLABORACIÓN — Repositorio, ramas y flujo de trabajo

Guía del repositorio GitHub del proyecto y de cómo trabajamos en equipo.

- **Repositorio:** https://github.com/matiasmoraga337-bit/rentacardb (público)
- **Equipo:** 3 personas (ver [`EQUIPO.md`](EQUIPO.md)).
- **Entrega:** 17 de noviembre.

> ⚠️ **Nunca subir secretos.** El repo es **público**: `.env`, claves y datos personales
> quedan fuera. Solo se versiona `.env.example` (ver [`SEGURIDAD.md`](SEGURIDAD.md)).

## 1) Ramas

| Rama | Propósito | Protegida |
|---|---|---|
| `main` | Versión estable / desplegable para la **demo**. | Sí |
| `develop` | **Integración**: aquí llegan los `feat/*`. Base del día a día. | Sí |
| `feat/<epica>-<descripcion>` | Una historia del backlog. Ej. `feat/E2.2-login-jwt`. | No |
| `fix/<descripcion>` | Corrección. Ej. `fix/validacion-rut`. | No |
| `chore/<descripcion>` | Mantenimiento (deps, CI, docs). | No |

**Flujo de integración:** `feat/* → develop` (integración continua) y `develop → main`
solo al cerrar un hito o antes de la demo.

## 2) Protección de ramas (Ruleset activo)

Sobre `main` y `develop` rige el ruleset **`proteccion-ramas`**:

- **Pull Request obligatorio** antes de fusionar (no se puede hacer push directo).
- **≥ 1 aprobación** de una persona distinta al autor.
- **CI en verde** (checks `Backend …` y `Frontend …`).
- **Conversaciones resueltas** y aprobaciones obsoletas descartadas al recibir nuevos push.
- Prohibido **force‑push** y **borrar** la rama.
- **Historial lineal** → se fusiona con **squash**.
- Las ramas `feat/*` y `fix/*` se **borran al fusionar** su PR (activar la opción al hacer el
  merge). `develop` **no** se borra: es la base de los releases `develop → main`.

> El **administrador** del repositorio puede hacer *bypass* en emergencias (p. ej. durante
> el arranque, antes de que estén todos los colaboradores). Los demás integrantes **no**.

## 3) Colaboradores

1. Cada integrante necesita **cuenta de GitHub**.
2. El dueño del repo va a **Settings → Collaborators and teams → Add people** y agrega a
   cada uno con permiso **Write** (leer, crear ramas y PRs; no administrar el repo).
3. Cada colaborador **acepta la invitación** (llega por correo o en github.com/notifications).

Una vez dentro, completar `CODEOWNERS` (`.github/CODEOWNERS`) con los usuarios reales para
que las revisiones se asignen automáticamente por área.

## 4) Etiquetas y milestones

- **Prioridad MoSCoW:** `prio: M`, `prio: S`, `prio: C`.
- **Área:** `backend`, `frontend`, `infra`, `database`, `docs`, `ci`, `test`.
- **Épicas:** `epic:E1` … `epic:E16` (ver [`BACKLOG.md`](BACKLOG.md)).
- **Milestones:** `S0` … `S4` y `Entrega` (fechas en [`CRONOGRAMA.md`](CRONOGRAMA.md)).

## 5) Tablero (GitHub Projects) — paso manual

El tablero requiere un permiso extra del token. Para crearlo:

```bash
gh auth refresh -s project,read:project
gh project create --owner matiasmoraga337-bit --title "RentaCarDB"
```

Luego crear columnas **Backlog / Todo / In Progress / Review / Done**. (Alternativa: crearlo
desde la web, pestaña **Projects** del repositorio.)

## 6) Convención de commits (Conventional Commits)

```
feat: agregar registro de usuario con verificacion de email
fix: corregir calculo de dias en la reserva
docs: actualizar contrato de /reservas
chore: subir version de eslint
```

## 7) Checklist de cada integrante

```bash
# 1. Configurar identidad
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# 2. Clonar
git clone https://github.com/matiasmoraga337-bit/rentacardb.git
cd rentacardb

# 3. Entorno
cp .env.example .env

# 4. Crear una rama para tu historia de develop
git checkout develop && git pull
git checkout -b feat/E2.2-login-jwt
```

Antes de pedir revisión: correr **lint + typecheck + tests** y verificar que no haya
secretos en el diff. Luego abrir el **Pull Request hacia `develop`**.

## 8) Tareas pendientes de configuración (manual)

- [ ] Agregar a los 2 colaboradores con rol **Write**.
- [ ] Completar `.github/CODEOWNERS` con los usuarios reales.
- [ ] Crear el tablero **Projects** (sección 5) y sus columnas.
