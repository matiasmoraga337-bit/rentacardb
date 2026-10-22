# Demo S4 — Extensiones y QA

Guion reproducible de cargos/multas, disputas, liquidaciones, notificaciones,
fotos y adjuntos.

## 1. Preparar entorno

```powershell
docker compose --env-file .env -p rentacardb-s2 -f "Producción/infra/docker-compose.yml" up -d --build
cd Producción/backend
$env:DOTENV_CONFIG_PATH=(Resolve-Path '../../.env').Path
$env:DB_HOST='localhost'
$env:DB_PORT='14330'
npm run seed
$env:API_URL='http://localhost:3000/api'
npm run seed:s4
npm run smoke:s4
```

`seed:s4` deja un arriendo `FINALIZADO` con cargo por km, daño, cargo extra,
multa, reseñas, disputa, liquidación, favorito, búsqueda, chat con adjunto y foto
de inspección. `smoke:s4` verifica el flujo completo.

## 2. Liquidaciones

1. Admin `admin@rentacar.cl` → `/admin/liquidaciones`.
2. Seleccionar proveedor demo y un período que incluya los movimientos.
3. **Generar** → estado `CALCULADA`.
4. **Aprobar** → `APROBADA`; **Pagar** → `PAGADA`.
5. Proveedor `proveedor@rentacar.cl` → `/proveedor/liquidaciones` y verificar el neto.

## 3. Disputas

1. Cliente o proveedor abre el detalle del arriendo `FINALIZADO`.
2. En **Abrir disputa**, elegir tipo, monto y descripción.
3. Admin → `/admin/disputas`, **Tomar en revisión** y **Resolver** con resolución.
4. Verificar el estado final en `/disputas`.

## 4. Notificaciones y outbox

1. Abrir la campana del layout (`/notificaciones`) y marcar una notificación como leída.
2. Admin → `/admin/outbox`: revisar estados `PENDIENTE`, `PROCESADO` y `ERROR`.
3. Mailpit: `http://localhost:8026` para ver los correos enviados.
4. Si hay un evento `ERROR`, usar **Reintentar**.

## 5. Fotos y adjuntos

1. Proveedor/operador → detalle del arriendo → inspección → subir imágenes.
2. Verificar la galería y abrir una foto.
3. Cliente → `/chat` → enviar un mensaje con una imagen/PDF adjunto.
4. Verificar el enlace del adjunto en el mensaje.

## 6. Verificación automática

```powershell
# BD
powershell -ExecutionPolicy Bypass -File sql/tests/run_tests.ps1

# Backend
cd Producción/backend
npm run lint; npm run typecheck; npm test; npm run build

# Frontend
cd Producción/frontend
npm run lint; npm run typecheck; npm test; npm run build

# Smoke S4 (API + BD + seed:s4)
cd Producción/backend
npm run smoke:s4
```

## 7. Pendiente / fuera de alcance

- SMS/PUSH reales: las notificaciones in-app usan `PUSH` y el correo usa Mailpit.
- Cargos extra y multas solo se permiten sobre arriendos `FINALIZADO`.
