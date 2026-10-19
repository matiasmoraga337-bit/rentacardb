/**
 * Seed de datos demo para poder iniciar sesion en S0.
 * Uso: npm run seed   (requiere la BD levantada y el .env configurado)
 *
 * Crea dos usuarios reutilizando sp_RegistrarUsuario:
 *   - admin@rentacar.cl  / Admin1234!   (ADMIN)
 *   - demo@rentacar.cl   / Demo1234!    (CLIENTE)
 */
import bcrypt from 'bcryptjs';
import { closePool } from '../src/config/db';
import * as repo from '../src/repositories/auth.repository';

interface DemoUser {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  email: string;
  password: string;
  rol: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    rut: '11111111-1',
    nombres: 'Admin',
    apellidoPaterno: 'Demo',
    email: 'admin@rentacar.cl',
    password: 'Admin1234!',
    rol: 'ADMIN',
  },
  {
    rut: '22222222-2',
    nombres: 'Cliente',
    apellidoPaterno: 'Demo',
    email: 'demo@rentacar.cl',
    password: 'Demo1234!',
    rol: 'CLIENTE',
  },
];

async function main(): Promise<void> {
  for (const user of DEMO_USERS) {
    try {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const row = await repo.registrarUsuario({
        rut: user.rut,
        nombres: user.nombres,
        apellidoPaterno: user.apellidoPaterno,
        email: user.email,
        passwordHash,
        rol: user.rol,
      });
      console.log(`OK  ${user.email} creado (ID ${row?.ID_usuario}, rol ${user.rol})`);
    } catch (err) {
      const message = (err as { message?: string }).message ?? String(err);
      if (message.includes('51105') || message.includes('51106') || message.includes('Ya existe')) {
        console.log(`SKIP ${user.email} ya existe.`);
      } else {
        console.error(`ERR  ${user.email}: ${message}`);
      }
    }
  }
  await closePool();
}

void main();
