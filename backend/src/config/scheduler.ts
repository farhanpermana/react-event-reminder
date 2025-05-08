// src/config/scheduler.ts
import schedule from 'node-schedule';
import dotenv from 'dotenv';

dotenv.config();

// Default timezone
const timezone = process.env.TIMEZONE!;

export { schedule, timezone };