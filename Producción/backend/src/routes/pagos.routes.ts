import { Router } from 'express';
import * as pagoController from '../controllers/pago.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  confirmarWebPaySchema,
  iniciarWebPaySchema,
  listarPagosQuerySchema,
  registrarPagoSchema,
} from '../schemas/pago.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(registrarPagoSchema),
  asyncHandler(pagoController.registrar),
);

router.get(
  '/',
  authenticate,
  validate(listarPagosQuerySchema, 'query'),
  asyncHandler(pagoController.listar),
);

router.post(
  '/webpay/iniciar',
  authenticate,
  authorize('CLIENTE'),
  validate(iniciarWebPaySchema),
  asyncHandler(pagoController.iniciarWebPay),
);

router.get(
  '/webpay/transaccion/:token',
  authenticate,
  asyncHandler(pagoController.transaccion),
);

router.post(
  '/webpay/confirmar',
  authenticate,
  authorize('CLIENTE'),
  validate(confirmarWebPaySchema),
  asyncHandler(pagoController.confirmarWebPay),
);

export default router;
