// src/controllers/webhookController.ts
import { Request, Response } from 'express';
import bot from '../config/telegram';
import logger from '../utils/logger';

class WebhookController {
  async telegramWebhook(req: Request, res: Response) {
    try {
      // Process the update with the bot instance
      await bot.handleUpdate(req.body);
      
      // Respond with 200 OK
      return res.status(200).end();
    } catch (error) {
      logger.error('Error processing Telegram webhook:', error);
      // Still return 200 to Telegram so it doesn't retry
      return res.status(200).end();
    }
  }
}

export default new WebhookController();