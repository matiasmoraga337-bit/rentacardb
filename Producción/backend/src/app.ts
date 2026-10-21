import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Fotos de vehiculos: publicas (el catalogo es publico).
  app.use(
    '/uploads/vehiculos',
    express.static(path.join(env.UPLOAD_DIR, 'vehiculos'), {
      maxAge: '7d',
      dotfiles: 'deny',
    }),
  );

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
