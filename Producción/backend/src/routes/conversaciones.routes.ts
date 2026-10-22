import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { attachmentUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { crearConversacionSchema, enviarMensajeSchema } from '../schemas/chat.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(chatController.listar));

router.post(
  '/',
  authenticate,
  authorize('CLIENTE'),
  validate(crearConversacionSchema),
  asyncHandler(chatController.crear),
);

router.get('/:id/mensajes', authenticate, asyncHandler(chatController.mensajes));

router.post(
  '/:id/mensajes/:mensajeId/adjuntos',
  authenticate,
  attachmentUpload.array('archivos', 4),
  asyncHandler(chatController.adjuntos),
);

router.post(
  '/:id/mensajes',
  authenticate,
  validate(enviarMensajeSchema),
  asyncHandler(chatController.enviar),
);

router.post('/:id/leidos', authenticate, asyncHandler(chatController.leidos));
router.post('/:id/cerrar', authenticate, asyncHandler(chatController.cerrar));

export default router;
