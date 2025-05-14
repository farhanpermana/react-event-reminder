// src/services/scheduler.service.ts
import { schedule } from '../config/scheduler';
import { Broadcast, TryoutSection, Course } from '../models';
import telegramService from './telegram.service';
import logger from '../utils/logger';
import moment from 'moment-timezone';
import emailService from './email.service';

class SchedulerService {
  private readonly jobs: Map<string, any> = new Map();

  async initializeScheduler() {
    logger.info('Initializing scheduler service...');

    // Cancel any existing jobs
    this.cancelAllJobs();

    // Schedule jobs for all active broadcasts
    const broadcasts = await Broadcast.findAll({
      where: { isActive: true },
    });

    for (const broadcast of broadcasts) {
      await this.scheduleJob(broadcast);
    }

    logger.info(`Initialized ${this.jobs.size} scheduled jobs`);

    // Schedule daily sync from Google Sheets at midnight
    this.scheduleGoogleSheetSync();
  }

  private scheduleGoogleSheetSync() {
    const jobId = 'google-sheet-sync';
    const job = schedule.scheduleJob(jobId, '0 0 * * *', async () => {
      try {
        const googleSheetService = require('./googlesheet.service').default;
        await googleSheetService.syncToDatabase();
        logger.info('Completed daily Google Sheet sync');

        // Reinitialize scheduler after sync
        await this.initializeScheduler();
      } catch (error) {
        logger.error('Error during Google Sheet sync:', error);
      }
    });

    if (job) {
      this.jobs.set(jobId, job);
      logger.info('Scheduled daily Google Sheet sync at midnight');
    } else {
      logger.error('Failed to schedule Google Sheet sync job');
    }
  }

  cancelAllJobs() {
    for (const [id, job] of this.jobs.entries()) {
      if (job && typeof job.cancel === 'function') {
        job.cancel();
        logger.info(`Cancelled scheduled job: ${id}`);
      } else {
        logger.warn(`Attempted to cancel invalid job: ${id}`);
      }
    }

    this.jobs.clear();
  }

  private async scheduleJob(broadcast: any) {
    const { id, code, scheduleType, targetTime, type } = broadcast;
    let jobId = `${code}-${type}-${id}`;

    // HH:mm format
    switch (scheduleType) {
      case 'every_day':
        this.scheduleCronJob(broadcast, jobId, targetTime, '*');
        break;

      case 'working_day':
        this.scheduleCronJob(broadcast, jobId, targetTime, '1-5');
        break;

      // 1d or 2d format
      case 'on-going':
        // Handle reference-based scheduling
        if (broadcast.referenceType && broadcast.referenceCode) {
          await this.scheduleReferenceBasedJob(broadcast);
        }
        break;

      default:
        logger.warn(`Unknown schedule type "${scheduleType}" for broadcast ${id}`);
        break;
    }
  }

  private scheduleCronJob(broadcast: any, jobId: string, targetTime: string, dayOfWeek: string) {
    const { id, code } = broadcast;

    if (/^\d{1,2}:\d{2}$/.test(targetTime)) {
      let [hour, minute] = targetTime.split(':');

      // Auto-pad single-digit hour
      if (hour.length === 1) {
        logger.warn(`Auto-padding hour "${hour}" to HH format for broadcast ${id} (${code})`);
        hour = hour.padStart(2, '0');
      }

      // Normalize dayOfWeek to ensure no extra spaces
      const normalizedDayOfWeek = dayOfWeek.trim().replace(/\s+/g, ' ');
      // Construct proper cron expression - ensure exactly one space between segments
      const cronExpression = `${minute} ${hour} * * ${normalizedDayOfWeek}`;

      // Convert cron hour to Jakarta time hour for logging
      const cronHour = parseInt(hour, 10);
      const jakartaMoment = moment.tz('Asia/Jakarta').hour(cronHour).minute(parseInt(minute, 10)).second(0);
      const jakartaHour = jakartaMoment.format('HH:mm');

      logger.info(`Scheduling ${jobId} to run at ${jakartaHour} Jakarta time with cron: ${cronExpression}`);

      try {
        const job = schedule.scheduleJob(jobId, cronExpression, async () => {
          await this.executeReminder(broadcast);
        });

        if (job) {
          this.jobs.set(jobId, job);
        } else {
          logger.error(`Failed to schedule cron job for broadcast ${id}: invalid cron expression "${cronExpression}"`);
        }
      } catch (error) {
        logger.error(`Exception scheduling cron job for broadcast ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      logger.error(`Invalid time format for broadcast ${id} (${code}): "${targetTime}". Expected format like H:mm or HH:mm`);
    }
  }

  private async scheduleReferenceBasedJob(broadcast: any) {
    const { id, code, referenceType, referenceCode, targetTime, type } = broadcast;

    if (!referenceType || !referenceCode) {
      logger.warn(`Cannot schedule reference-based job for broadcast ${id}: missing reference information`);
      return;
    }

    try {
      let referenceEntity;
      let startDate: Date | undefined; // Explicitly type startDate as potentially undefined

      if (referenceType === 'tryout-section') {
        referenceEntity = await TryoutSection.findOne({
          where: { code: referenceCode },
        });

        if (referenceEntity?.startDateTime) {
          startDate = new Date(referenceEntity.startDateTime);
        }
      } else if (referenceType === 'course') {
        referenceEntity = await Course.findOne({
          where: { code: referenceCode },
        });

        if (referenceEntity?.startDate) {
          startDate = new Date(referenceEntity.startDate);
        }
      }

      if (!referenceEntity || !startDate) {
        logger.warn(`Reference entity not found for broadcast ${id}: ${referenceType} ${referenceCode}`);
        return;
      }

      // Now startDate is guaranteed to have a value due to the check above
      let reminderTime;

      if (/^(\d+)d$/.test(targetTime)) {
        // Days before
        const days = parseInt(targetTime.match(/^(\d+)d$/)[1]);
        reminderTime = moment(startDate).subtract(days, 'days').toDate();
      } else if (/^(\d+)h$/.test(targetTime)) {
        // Hours before
        const hours = parseInt(targetTime.match(/^(\d+)h$/)[1]);
        reminderTime = moment(startDate).subtract(hours, 'hours').toDate();
      } else {
        logger.warn(`Invalid targetTime format for broadcast ${id}: ${targetTime}`);
        return;
      }

      // Don't schedule if the reminder time is in the past
      const now = new Date();
      if (reminderTime <= now) {
        logger.warn(`Reminder time is in the past for broadcast ${id}: ${reminderTime}`);
        return;
      }

      const jobId = `${code}-${type}-${id}-reference`;
      logger.info(`Scheduling reference-based job ${jobId} for ${moment(reminderTime).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')} Jakarta time`);

      const job = schedule.scheduleJob(jobId, reminderTime, async () => {
        await this.executeReminder(broadcast);
      });

      if (job) {
        this.jobs.set(jobId, job);
      } else {
        logger.error(`Failed to schedule reference-based job for broadcast ${id}`);
      }
    } catch (error) {
      logger.error(`Error scheduling reference-based job for broadcast ${id}:`, error);
    }
  }

  async executeReminder(broadcast: any) {
    const { id, code, content, username, type } = broadcast;

    try {
      logger.info(`Executing reminder for broadcast ${id}: ${code}`);

      let result;
      // In executeReminder method, update the email section:
      if (type === 'email') {
        const subject = `Reminder: ${code}`;

        // Generate professional email template
        const htmlContent = emailService.generateEmailTemplate({
          userName: username ?? 'Valued Customer',
          title: `Reminder: ${code}`,
          message: content,
          companyName: 'Your Company Name'
        });

        if (username) {
          // Send to specific user
          logger.info(`Sending email to specific user: ${username}`);
          result = await emailService.sendReminderToSpecificUser(username, subject, htmlContent);
        } else {
          // Send to all users
          logger.info('Sending email to all active users');
          result = await emailService.sendReminderToAllUsers(subject, htmlContent);
        }
      } else if (type === 'telegram') {
        logger.info(`Sending Telegram message for broadcast ${id}`);

        if (username) {
          // Send to specific user
          logger.info(`Attempting to send to specific user: ${username}`);
          result = await telegramService.sendReminderToSpecificUser(username, content);
          logger.info(`Result of sending to ${username}: ${JSON.stringify(result)}`);
        } else {
          // Send to all users
          logger.info(`Attempting to send to all users`);
          result = await telegramService.sendReminderToAllUsers(content);
          logger.info(`Sent broadcast ${broadcast.code} to all users. Content: "${content}", Result: ${JSON.stringify(result)}`);
        }
      }

      // Update lastExecuted date, not targetTime
      await broadcast.update({ lastExecuted: new Date() });

      logger.info(`Successfully executed reminder for broadcast ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error executing reminder for broadcast ${id}:`, error);
      throw error;
    }
  }

  async executeManualReminder(broadcastId: number) {
    try {
      const broadcast = await Broadcast.findByPk(broadcastId);

      if (!broadcast) {
        throw new Error(`Broadcast with ID ${broadcastId} not found`);
      }

      if (!broadcast.isActive) {
        throw new Error(`Broadcast with ID ${broadcastId} is not active`);
      }

      return await this.executeReminder(broadcast);
    } catch (error) {
      logger.error(`Error executing manual reminder for broadcast ${broadcastId}:`, error);
      throw error;
    }
  }

  // Get job status
  getJobStatus() {
    const activeJobs = [];

    for (const [id, job] of this.jobs.entries()) {
      if (job && typeof job.nextInvocation === 'function') {
        activeJobs.push({
          id,
          nextInvocation: job.nextInvocation() ? job.nextInvocation().toDate() : null,
        });
      } else {
        activeJobs.push({
          id,
          nextInvocation: null,
          error: 'Invalid job object'
        });
      }
    }

    return {
      totalJobs: this.jobs.size,
      activeJobs,
    };
  }

  // Get next upcoming reminder for a specific broadcast
  async getNextReminderTime(broadcastId: number) {
    try {
      const broadcast = await Broadcast.findByPk(broadcastId);

      if (!broadcast) {
        throw new Error(`Broadcast with ID ${broadcastId} not found`);
      }

      const jobId = `${broadcast.code}-${broadcast.type}-${broadcast.id}`;
      const job = this.jobs.get(jobId);

      if (!job) {
        const referenceJobId = `${broadcast.code}-${broadcast.type}-${broadcast.id}-reference`;
        const referenceJob = this.jobs.get(referenceJobId);

        if (!referenceJob || typeof referenceJob.nextInvocation !== 'function') {
          return null;
        }

        return {
          broadcastId,
          nextInvocation: referenceJob.nextInvocation() ? referenceJob.nextInvocation().toDate() : null,
        };
      }

      if (typeof job.nextInvocation !== 'function') {
        return {
          broadcastId,
          nextInvocation: null,
          error: 'Invalid job object'
        };
      }

      return {
        broadcastId,
        nextInvocation: job.nextInvocation() ? job.nextInvocation().toDate() : null,
      };
    } catch (error) {
      logger.error(`Error getting next reminder time for broadcast ${broadcastId}:`, error);
      throw error;
    }
  }
}

export default new SchedulerService();