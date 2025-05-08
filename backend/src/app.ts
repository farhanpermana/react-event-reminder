// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import logger from './utils/logger';
import telegramService from './services/telegram.service';
import schedulerService from './services/scheduler.service';
import debugRoutes from './routes/debug';
import bot from './config/telegram';
import { webhookCallback } from 'grammy';

const app = express();

app.use('/debug', debugRoutes);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

if (!process.env.NGROK_URL) {
  throw new Error('NGROK_URL not set');
}

const BOT_WEBHOOK_PATH = '/webhook';
const webhookUrl = `${process.env.NGROK_URL}${BOT_WEBHOOK_PATH}`;

// Register Telegram webhook endpoint
app.use(
  BOT_WEBHOOK_PATH, 
  express.json(),
  webhookCallback(bot, 'express')
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize Telegram bot and scheduler
const initializeServices = async () => {
  try {
    await telegramService.initialize();
    await schedulerService.initializeScheduler();
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Error initializing services:', error);
  }
};
  

export { app, initializeServices };