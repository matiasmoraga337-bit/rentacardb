import { app } from './app';
import { closePool, getPool } from './config/db';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  try {
    await getPool();
    console.log('Conexion a la base de datos establecida.');
  } catch (err) {
    console.warn(
      'No se pudo conectar a la base de datos al iniciar:',
      (err as Error).message,
    );
  }

  const server = app.listen(env.API_PORT, () => {
    console.log(`API RentaCarDB en http://localhost:${env.API_PORT}/api`);
    console.log(`Documentacion en http://localhost:${env.API_PORT}/api/docs`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await closePool();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void bootstrap();
