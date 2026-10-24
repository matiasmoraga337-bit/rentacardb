import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { licenciaSchema, perfilSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.put(
  '/perfil',
  authenticate,
  validate(perfilSchema),
  asyncHandler(authController.actualizarPerfil),
);

router.get(
  '/perfil/licencia',
  authenticate,
  asyncHandler(authController.licencia),
);

router.post(
  '/perfil/licencia',
  authenticate,
  validate(licenciaSchema),
  asyncHandler(authController.registrarLicencia),
);

router.get(
  '/:id/roles',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(authController.roles),
);

export default router;
