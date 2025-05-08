// src/config/telegram.ts
import { Bot } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables.');
}

const bot = new Bot(token);

export default bot;
