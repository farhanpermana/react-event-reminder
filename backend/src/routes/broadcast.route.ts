// src/routes/broadcastRoutes.ts
import { Router } from 'express';
import broadcastController from '../controllers/broadcast.controller';

const router = Router();

router.get('/', broadcastController.getAll);
router.get('/:id', broadcastController.getById);
router.post('/sync', broadcastController.syncFromGoogleSheet);
router.post('/:id/execute', broadcastController.executeManually);

// New endpoints for scheduler status
router.get('/scheduler/status', broadcastController.getJobStatus);
router.get('/:id/next-reminder', broadcastController.getNextReminderTime);
router.post('/test-telegram', broadcastController.testTelegramMessage);
router.post('/test-email', broadcastController.testEmailReminder);
export default router;