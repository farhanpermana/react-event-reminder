// src/routes/webhookRoutes.ts
import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';

const router = Router();

router.post('/telegram/webhook', webhookController.telegramWebhook);

export default router;