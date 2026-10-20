import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { perfilSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.put(
  '/perfil',
  authenticate,
  validate(perfilSchema),
  asyncHandler(authController.actualizarPerfil),
);

router.get(
  '/:id/roles',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(authController.roles),
);

export default router;
