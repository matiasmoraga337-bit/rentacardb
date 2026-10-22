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
  APP_URL: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_IMAGE_MB: z.coerce.number().int().positive().default(10),
  MAX_DOC_MB: z.coerce.number().int().positive().default(10),

  RESERVAS_JOB_ENABLED: boolFromString(false),
  RESERVAS_JOB_INTERVAL_MS: z.coerce.number().int().positive().default(300000),

  OUTBOX_JOB_ENABLED: boolFromString(false),
  OUTBOX_JOB_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().max(500).default(20),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: boolFromString(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('RentaCarDB <no-reply@rentacar.cl>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracion de entorno invalida:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
