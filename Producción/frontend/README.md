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
