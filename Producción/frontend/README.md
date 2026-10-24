# Frontend — Web RentaCarDB

SPA (React + Vite + TypeScript + Tailwind CSS) que consume la API de RentaCarDB.

## Puesta en marcha (local)

```bash
cp .env.example .env      # VITE_API_URL apunta a la API
npm install
npm run dev               # http://localhost:5173
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Typecheck + build de producción a `dist/`. |
| `npm run preview` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Chequeo de tipos. |
| `npm test` | Vitest + Testing Library. |
| `npm run test:e2e` | Playwright E2E (requiere API, BD y seed). |

## E2E

En local Playwright usa el Microsoft Edge instalado (`channel: 'msedge'`); en CI usa Chromium. Para correr los tests:

```powershell
npm run test:e2e
```

Requiere la API, la base de datos y el seed demo levantados. La configuración reutiliza
Vite en http://localhost:5173 si ya está corriendo.

## Estructura (S0)

```
src/
├─ app/            # router y providers (Query, Auth)
├─ components/     # ui/ (design system) y layout/
├─ features/auth/  # login, contexto de sesión, guard de rutas
├─ lib/            # cliente de API y utilidades
└─ pages/          # páginas
```

## Estado

S0: layout base, login funcional contra `POST /api/auth/login`, sesión con JWT y guard de
rutas. Los módulos de dominio llegan en S1–S4 (ver [`../PLAN.md`](../PLAN.md)).
