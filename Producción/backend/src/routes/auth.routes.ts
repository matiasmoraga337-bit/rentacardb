import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { loginSchema, registroSchema } from '../schemas/auth.schema';
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
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
