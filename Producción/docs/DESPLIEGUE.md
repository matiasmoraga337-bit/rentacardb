# DESPLIEGUE

## 1) Entornos

| Entorno | Uso | BD |
|---|---|---|
| **dev** | desarrollo local | SQL Server en Docker (o local) |
| **prod (demo)** | presentación | Docker local · opcional Render |

## 2) Docker Compose (local)

`infra/docker-compose.yml` con 3 servicios:

```yaml
services:
  db:      # mcr.microsoft.com/mssql/server:2022-latest  (SA_PASSWORD, puerto 1433)
  api:     # build ./backend  (puerto 3000, depende de db)
  web:     # build ./frontend (puerto 5173 / nginx en prod)
```

- **Volúmenes:** datos de la BD y carpeta `uploads/`.
- **`.env`** en la raíz (copiado de `.env.example`).
- **Arranque:** `docker compose -f infra/docker-compose.yml up --build`.
- Al iniciar la BD por primera vez, se ejecuta `database/RentacarFinal.sql` (init) para crear el esquema.

> **Compatibilidad SQL Server:** el script fija `COMPATIBILITY_LEVEL = 170` (SQL 2025). La imagen
> Linux `2022-latest` soporta hasta 160. Opciones: (a) ajustar el nivel a 160 en el script de
> init; (b) correr la BD en el SQL Server local del equipo y dockerizar solo api+web.
> **Decisión recomendada:** usar la imagen 2022 + init con nivel 160 para el contenedor.

## 3) Dockerfiles

- **backend:** multi‑stage (build TS → imagen node slim), `CMD node dist/server.js`.
- **frontend:** build con Vite → servido con **nginx** (prod) o `vite` (dev).

## 4) CI (GitHub Actions)

`.github/workflows/ci.yml`:
1. Lint + typecheck (backend y frontend).
2. Tests (Jest/Vitest).
3. Build (ambos).
4. (Opcional) build de imágenes Docker.

## 5) Despliegue en Render (opcional, para la presentación)

- **Backend:** Web Service (Docker) → variables de entorno.
- **BD:** SQL Server gestionado (Azure SQL) **o** túnel al SQL local. Alternativa simple: mantener
  la BD en local y exponer la API con un túnel (ngrok) para la demo.
- **Frontend:** Static Site (build de Vite) apuntando a la URL del backend.

> Para la demo, lo más simple y robusto es **correr todo en Docker local** y presentar desde el
> mismo equipo.

## 6) Configuración por entorno

| Variable | dev | prod |
|---|---|---|
| `DB_HOST` | `db` | host real |
| `DB_PASSWORD` | desde `.env` | secreto |
| `JWT_SECRET` | dev | secreto fuerte |
| `CORS_ORIGIN` | `http://localhost:5173` | dominio del front |

## 7) Backups y datos

- **Datos de ejemplo** (`database/seed-demo.sql`) para la presentación.
- Antes de la demo: respaldar/restaurar la BD para partir de un estado conocido.
