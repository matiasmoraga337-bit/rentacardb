import 'dotenv/config';
import { z } from 'zod';

const boolFromString = (def: boolean) =>
  z
    .enum(['true', 'false'])
    .default(String(def) as 'true' | 'false')
    .transform((v) => v === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_USER: z.string().default('sa'),
  DB_PASSWORD: z.string().default(''),
  DB_DATABASE: z.string().default('RentaCarDB'),
  DB_ENCRYPT: boolFromString(true),
  DB_TRUST_SERVER_CERTIFICATE: boolFromString(true),

  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracion de entorno invalida:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
