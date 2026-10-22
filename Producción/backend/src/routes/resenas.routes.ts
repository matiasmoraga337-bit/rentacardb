import { Router } from 'express';
import * as resenaController from '../controllers/resena.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { crearResenaSchema } from '../schemas/resena.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/',
  authenticate,
  validate(crearResenaSchema),
  asyncHandler(resenaController.crear),
);

export default router;
