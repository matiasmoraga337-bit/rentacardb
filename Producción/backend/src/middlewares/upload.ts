import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const imageMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const documentMimes = new Set(['application/pdf']);

const mb = (n: number): number => n * 1024 * 1024;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: mb(env.MAX_IMAGE_MB), files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!imageMimes.has(file.mimetype)) {
      cb(new AppError(400, 'MIME_INVALIDO', 'Solo se permiten imagenes JPG, PNG, WebP o AVIF.'));
      return;
    }
    cb(null, true);
  },
});

const attachmentMimes = new Set([...imageMimes, ...documentMimes]);

export const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: mb(env.MAX_DOC_MB), files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!attachmentMimes.has(file.mimetype)) {
      cb(new AppError(400, 'MIME_INVALIDO', 'Solo se permiten imagenes o PDF.'));
      return;
    }
    cb(null, true);
  },
});

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: mb(env.MAX_DOC_MB), files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!documentMimes.has(file.mimetype)) {
      cb(new AppError(400, 'MIME_INVALIDO', 'Solo se permiten documentos PDF.'));
      return;
    }
    cb(null, true);
  },
});
