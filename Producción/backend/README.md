# Backend — API RentaCarDB

API REST (Node.js + Express + TypeScript) que consume la base `RentaCarDB` mediante
**stored procedures** con el driver `mssql` (sin ORM).

## Requisitos

- Node.js 20+
- Acceso a SQL Server con la base `RentaCarDB` cargada.

## Puesta en marcha (local)

```bash
cp .env.example .env      # completar DB_PASSWORD y JWT_SECRET
npm install
npm run seed              # crea usuarios demo (admin@rentacar.cl / demo@rentacar.cl)
npm run dev               # http://localhost:3000/api  ·  docs en /api/docs
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo (tsx watch). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta el build (`node dist/server.js`). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Chequeo de tipos sin emitir. |
| `npm test` | Jest + Supertest. |
| `npm run seed` | Datos demo (usuarios ADMIN y CLIENTE). |

## Endpoints S0

| Método | Ruta | Acceso | SP |
|---|---|---|---|
| GET | `/api/health` | Público | — |
| POST | `/api/auth/login` | Público | `sp_Login` |
| POST | `/api/auth/registro` | Público | `sp_RegistrarUsuario` |
| GET | `/api/auth/me` | JWT | `Usuario`/`Persona`/`UsuarioRol` |

## Notas

- `sp_Login` compara el hash por igualdad; como usamos **bcrypt**, la API compara la
  contraseña localmente y llama al SP con el hash almacenado para conservar la auditoría
  en `LoginHistorial`.
- La estructura por capas (`routes → controllers → services → repositories`) está descrita
  en [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md).
