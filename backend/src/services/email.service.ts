// src/services/emailService.ts
import transporter from '../config/email';
import { User } from '../models';
import logger from '../utils/logger';
import { Op } from 'sequelize';

class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  }

  async sendReminderToUser(userId: number, subject: string, content: string) {
    const user = await User.findByPk(userId);
    if (!(user?.email && user.isActive)) {
      logger.warn(`Unable to send email to user ID ${userId}: User not found or inactive`);
      return null;
    }

    return this.sendEmail(user.email, subject, content);
  }

  async sendReminderToAllUsers(subject: string, content: string, excludeUsernames: string[] = []) {
    const users = await User.findAll({
      where: {
        isActive: true,
        ...(excludeUsernames.length > 0 && {
          username: {
            [Op.notIn]: excludeUsernames,
          },
        }),
      },
    });

    const results = [];
    for (const user of users) {
      try {
        const result = await this.sendEmail(user.email, subject, content);
        results.push({ userId: user.id, status: 'success', messageId: result.messageId });
      } catch (error) {
        results.push({ userId: user.id, status: 'error', error: (error as Error).message });
      }
    }

    return results;
  }

  async sendReminderToSpecificUser(username: string, subject: string, content: string) {
    const user = await User.findOne({ where: { username, isActive: true } });
    if (!user?.email) {
      logger.warn(`Unable to send email to username ${username}: User not found or inactive`);
      return null;
    }

    return this.sendEmail(user.email, subject, content);
  }
}

export default new EmailService();