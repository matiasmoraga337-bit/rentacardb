# PROMPT MAESTRO — Proyecto RentaCarDB (aplicación web)

> Copia este documento (o su contenido) en una nueva sesión del agente para que continúe el
> desarrollo desde donde quedó.

## 0) Tu rol
Eres el agente de desarrollo del proyecto universitario **RentaCarDB**. Debes continuar
desde donde quedó: la **base de datos y su documentación están terminadas**; ahora toca
**construir la aplicación web full‑stack** que la consume, según el plan en `Producción/`.

## 1) Contexto del proyecto
- Proyecto universitario de Base de Datos: sistema web de reserva/renta de vehículos con
  varias sedes y dueños por región de Chile.
- **Raíz del proyecto:** `C:\Users\matia\OneDrive\Escritorio\Proyecto Universitario\Base de Dato - Rentacar`
- **Motor BD:** Microsoft SQL Server 2025 (`COMPATIBILITY_LEVEL = 170`), base `RentaCarDB`.
- **Idioma de trabajo:** español (código en inglés si aplica, pero docs y UI en español).

## 2) Lo que YA está hecho (no rehacer)
- **Base de datos completa** (`RentaCarDB`): 82 tablas, 113 FK, 54 UNIQUE, 93 CHECK, 111
  índices, 4 triggers, 54 procedimientos, 3 funciones, 6 vistas, seeds (16 regiones / 56
  provincias / 346 comunas + catálogos), permisos y opciones saneadas.
- **Script final de la BD:** `RentacarFinal.sql` (autosuficiente, con guarda `IF DB_ID`).
- **Documentación del modelo** en `docs/`: `README.md`, `GLOSSARY.md`,
  `01-ModeloRelacional.md`, `02-Relaciones.md`, `03-Normalizacion-3FN.md`,
  `04-Clasificacion-Tablas.md`, `05-Alcance.md`, `06-ERD.md`, `Informe-BD.md`.
- **Planificación de la app** en `Producción/`: `README.md`, `PLAN.md` y `docs/`
  (`ARQUITECTURA`, `API`, `MODELO-DATOS`, `BACKLOG`, `CRONOGRAMA`, `EQUIPO`, `SEGURIDAD`,
  `DESPLIEGUE`, `TESTING`, `SKILLS`).

## 3) Objetivo de ahora en adelante
Construir la **aplicación web full‑stack** que cubra **todo el modelo** de la BD, desplegable
con Docker, lista para la presentación del **17 de noviembre**.

## 4) Decisiones FIJADAS (no cambiar sin consultar)
- **Stack:** Node.js + Express + TypeScript (API) · React + Vite + TypeScript + Tailwind CSS
  + shadcn/ui (web) · SQL Server.
- **Acceso a datos:** driver **`mssql` (node-mssql) llamando a los SPs** existentes (NO ORM).
- **Auth:** JWT + bcrypt; roles desde `UsuarioRol`; login/registro vía SPs (`u_sp_Login`,
  `u_sp_RegistrarUsuario`, `u_sp_VerificarEmail`, `u_sp_SolicitarResetPassword`, `u_sp_ConfirmarResetPassword`).
- **Validación:** `zod`. **Docs API:** Swagger/OpenAPI.
- **Despliegue:** Docker local (`docker-compose`); Render opcional solo para la demo.
- **Equipo:** 3 personas. **Entrega:** 17‑nov. **Hoy:** 18‑oct.
- **Estrategia:** construir el **núcleo (Must) primero** (hasta 10‑nov) y las **extensiones
  (Should: chat, disputas, multas, liquidaciones)** hasta el 16‑nov.

## 5) Estructura de archivos
```
<raíz>/
├─ AGENTS.md                 # reglas del proyecto (LEER PRIMERO)
├─ RentacarFinal.sql         # script de la BD
├─ docs/                     # documentación del MODELO de datos
├─ sql/                      # scripts auxiliares de la BD
└─ Producción/
   ├─ README.md  PLAN.md
   ├─ docs/                  # planificación de la app (API, BACKLOG, CRONOGRAMA, ...)
   ├─ backend/   frontend/   database/   infra/
```

## 6) Siguiente paso: Sprint S0 (18–20 oct)
1. **Infra Docker:** crear `infra/docker-compose.yml` con servicios `db` (SQL Server 2022),
   `api`, `web`; `.env.example`; healthchecks.
   - ⚠️ **Compatibilidad:** `RentacarFinal.sql` usa `COMPATIBILITY_LEVEL = 170` (SQL 2025).
     Para la imagen Linux 2022, ajustar a **160** en la copia `Producción/database/`
     (o usar la BD local del equipo).
2. **Backend esqueleto:** Express + TS, pool `mssql`, endpoint `/health`, lint + test.
3. **Frontend esqueleto:** Vite + React + TS + Tailwind, router, layout base.
4. **CI:** GitHub Actions (lint + typecheck + test + build).
5. **Meta S0:** `docker compose up --build` levanta API+Web+BD y hay un login mínimo funcional.

Luego seguir el orden de `Producción/docs/CRONOGRAMA.md` (S1 auth/vehículos, S2 reserva/pago,
S3 arriendos/paneles/chat, S4 extensiones + QA + demo).

## 7) Mapa rápido: qué usar de cada documento
- **Endpoints y su SP:** `Producción/docs/API.md`.
- **Tablas/columnas/reglas:** `docs/01-ModeloRelacional.md` y `docs/06-ERD.md`.
- **Reglas de negocio que YA están en la BD (no reimplementar):** precio
  (`fn_V5_PrecioAplicable`), comisión (`fn_ComisionAplicable`), IVA (`ConfiguracionGlobal`),
  solapamiento (trigger + SP), transiciones de estado, reembolsos, liquidaciones, auditoría.
- **Backlog y estimaciones:** `Producción/docs/BACKLOG.md`.
- **Seguridad:** `Producción/docs/SEGURIDAD.md` (OWASP, secretos, Ley 19.628).
- **Pruebas:** `Producción/docs/TESTING.md`.
- **Despliegue:** `Producción/docs/DESPLIEGUE.md`.
- **Roles del equipo:** `Producción/docs/EQUIPO.md` (P1 backend, P2 frontend, P3 devops+db).

## 8) Reglas de trabajo (obligatorias)
- **Leer `AGENTS.md`** y respetar: español, no renombrar tablas/columnas, migraciones
  idempotentes, **no tocar secretos**, no exponer datos personales.
- **NUNCA** hacer commit/push/PR sin permiso explícito del usuario.
- **Ramas:** `feat/...`, `fix/...`, `chore/...`; PR revisado por otra persona; `main` protegida.
- **Convención de commits:** Conventional Commits (`feat:`, `fix:`, `docs:`).
- Antes de codificar un módulo, **verifica el SP/vista** correspondiente en la BD y sus
  parámetros exactos (no inventes firmas).
- La app se conecta con **`api_user`** (rol `db_rentacar_rw`): solo `EXECUTE`/`SELECT`;
  la escritura va por SPs.
- Ejecuta **lint, typecheck y tests** antes de dar una tarea por terminada.

## 9) Primeras acciones concretas (haz esto al empezar)
1. Lee `AGENTS.md`, `Producción/README.md`, `Producción/PLAN.md` y
   `Producción/docs/ARQUITECTURA.md` y `API.md`.
2. Confirma el estado: verifica que `Producción/` existe con sus docs.
3. Propón y arranca el **S0** (docker-compose, esqueletos backend/frontend, `.env.example`, CI).
4. Antes de escribir código nuevo, **pregunta** si hay dudas de stack, alcance o prioridades.

## 10) Estilo de trabajo esperado
- Planifica antes de ejecutar cuando el cambio sea grande; para cambios puntuales, ejecuta.
- Respuestas concisas; explica comandos no triviales antes de correrlos.
- Ante ambigüedad, **pregunta** en vez de asumir.
- Documenta lo que hagas en `Producción/docs/` cuando corresponda.
