import { Router } from 'express';
import { pingDatabase } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const db = await pingDatabase();
    res.status(200).json({
      status: 'ok',
      service: 'rentacardb-api',
      db: db ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
