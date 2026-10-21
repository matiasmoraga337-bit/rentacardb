import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  loginSchema,
  recuperarSchema,
  registroSchema,
  resetPasswordSchema,
  verificarEmailSchema,
} from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Demasiados intentos.', details: [] } },
});

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post(
  '/registro',
  authLimiter,
  validate(registroSchema),
  asyncHandler(authController.registro),
);
router.post(
  '/verificar-email',
  authLimiter,
  validate(verificarEmailSchema),
  asyncHandler(authController.verificarEmail),
);
router.post(
  '/recuperar',
  authLimiter,
  validate(recuperarSchema),
  asyncHandler(authController.recuperar),
);
router.post(
  '/recuperar/confirmar',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.recuperarConfirmar),
);
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
