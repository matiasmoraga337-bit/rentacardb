# Infra — Docker

Entorno reproducible de RentaCarDB: **SQL Server 2022** + **API** + **Web**.

## Levantar

Desde la **raíz del repo**:

```bash
cp .env.example .env          # completar DB_PASSWORD y JWT_SECRET
docker compose -f Producción/infra/docker-compose.yml up --build
```

| Servicio | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3000/api |
| API docs (Swagger) | http://localhost:3000/api/docs |
| SQL Server | localhost:14330 (host) → 1433 (contenedor) |
| Mailpit (correo dev) | http://localhost:8026 |

Al primer arranque, el servicio `db-init` aplica el script canónico `RentacarFinal.sql`
(raíz del repo, esquema completo) cuando la BD ya responde. Para poder iniciar sesión, crear los
usuarios demo contra la BD del contenedor:

```bash
cd Producción/backend
DB_HOST=localhost DB_PORT=14330 npm run seed
```

> `npm run seed` usa las mismas variables de entorno; apuntá `DB_HOST=localhost` para
> conectar a la BD del contenedor.

## Notas

- **Fuente única:** `RentacarFinal.sql` (raíz) es compatible con **SQL Server 2022**
  (`COMPATIBILITY_LEVEL = 160`), sin rutas `FILENAME` de Windows y sin `OPTIMIZED_LOCKING`.
  Corre igual en SQL Server 2025. No hay copia duplicada en `database/`.
- **Init idempotente:** el servicio `db-init` ejecuta `../database/init.sh`, que aplica el
  esquema solo si la base aún no tiene tablas (seguro para reinicios con el volumen poblado).
- **Credenciales SA:** el usuario `api_user` de la BD es `WITHOUT LOGIN`; en el entorno
  Docker la API se conecta como `sa` (solo para desarrollo/demo).
- **Volúmenes:** `mssql-data` (datos de la BD) y `uploads` (fotos de vehículos y documentos).
- Para reiniciar la BD desde cero: `docker compose -f Producción/infra/docker-compose.yml down -v`.
