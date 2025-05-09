// src/utils/logger.ts
import winston from 'winston';
import moment from 'moment-timezone';

const timezoneFormat = winston.format((info, opts) => {
  info.timestamp = moment().tz('Asia/Jakarta').format();
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    timezoneFormat(), // Apply the timezone format first
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;