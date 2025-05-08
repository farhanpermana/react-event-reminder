// src/controllers/broadcastController.ts
import { Request, Response } from 'express';
import { Broadcast } from '../models';
import googleSheetService from '../services/googlesheet.service';
import schedulerService from '../services/scheduler.service';
import logger from '../utils/logger';
import telegramService  from '../services/telegram.service';


class BroadcastController {
  async getAll(req: Request, res: Response) {
    try {
      const broadcasts = await Broadcast.findAll({
        order: [['createdAt', 'DESC']],
      });
      return res.json(broadcasts);
    } catch (error) {
      logger.error('Error getting broadcasts:', error);
      return res.status(500).json({ error: 'Failed to retrieve broadcasts' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const broadcast = await Broadcast.findByPk(id);
      
      if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
      }
      
      return res.json(broadcast);
    } catch (error) {
      logger.error(`Error getting broadcast ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to retrieve broadcast' });
    }
  }

  async syncFromGoogleSheet(req: Request, res: Response) {
    try {
      const result = await googleSheetService.syncToDatabase();
  
      try {
        await schedulerService.initializeScheduler();
      } catch (schedulerError) {
        logger.error('Scheduler reinitialization failed:', schedulerError);
        return res.status(500).json({
          ...result,
          schedulerReinitialized: false,
          error: 'Broadcasts synced, but failed to reinitialize scheduler',
          schedulerError: schedulerError instanceof Error ? schedulerError.message : schedulerError,
        });
      }
  
      return res.json({
        ...result,
        schedulerReinitialized: true,
        message: result.message || 'Successfully synced and scheduler reinitialized',
      });
    } catch (error) {
      logger.error('Error syncing from Google Sheet:', error);
      return res.status(500).json({ 
        error: 'Failed to sync from Google Sheet',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async executeManually(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const broadcastId = parseInt(id);
  
      if (isNaN(broadcastId)) {
        return res.status(400).json({ error: 'Invalid broadcast ID' });
      }
      
      const broadcast = await Broadcast.findByPk(broadcastId);
      if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
      }
  
      const result = await schedulerService.executeManualReminder(broadcastId);
      
      return res.json({
        message: `Manually executed broadcast: ${broadcast.code}`,
        broadcastId,
        type: broadcast.type,
        isActive: broadcast.isActive,
        result: result || 'No recipients found',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error(`Error manually executing broadcast ${req.params.id}:`, error);
      return res.status(500).json({ 
        error: 'Failed to manually execute broadcast',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
  
  async getJobStatus(req: Request, res: Response) {
    try {
      const status = schedulerService.getJobStatus();
      return res.json(status);
    } catch (error) {
      logger.error('Error getting job status:', error);
      return res.status(500).json({ error: 'Failed to retrieve job status' });
    }
  }
  
  async getNextReminderTime(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const broadcastId = parseInt(id);
      
      if (isNaN(broadcastId)) {
        return res.status(400).json({ error: 'Invalid broadcast ID' });
      }
      
      const result = await schedulerService.getNextReminderTime(broadcastId);
      
      if (!result) {
        return res.status(404).json({ error: 'No scheduled reminders found for this broadcast' });
      }
      
      return res.json(result);
    } catch (error) {
      logger.error(`Error getting next reminder time for broadcast ${req.params.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ 
        error: 'Failed to get next reminder time',
        message: errorMessage 
      });
    }
  }

async testTelegramMessage(req: Request, res: Response) {
    try {
      const { chatId, message } = req.body;
      
      if (!chatId || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['chatId', 'message'] 
        });
      }
      
      // Log the attempt
      console.log(`Attempting to send message to Telegram chatId: ${chatId}`);
      
      // Call the telegram service directly
      const result = await telegramService.sendMessage(Number(chatId), message);
      
      return res.json({
        success: true,
        message: `Message sent to Telegram chatId: ${chatId}`,
        result
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      return res.status(500).json({ 
        error: 'Failed to send test message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new BroadcastController();