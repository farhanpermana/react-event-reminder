// src/services/telegramService.ts
import bot from "../config/telegram";
import { User } from "../models";
import logger from "../utils/logger";
import { generateRandomUser } from "../utils/helper";

class TelegramService {
  async initialize() {
    try {
      const webhookUrl = process.env.NGROK_URL + "/webhook";
      if (!webhookUrl) {
        throw new Error(
          "NGROK_URL is not defined in the environment variables."
        );
      }
      await bot.api.setWebhook(webhookUrl);

      // Set up command handlers
      bot.command("start", (ctx) => this.handleStartCommand(ctx));
      bot.command("help", (ctx) => this.handleHelpCommand(ctx));
      bot.command("register", (ctx) => this.handleRegisterCommand(ctx));
      bot.on("message", (ctx) => this.handleMessage(ctx));

      logger.info(`Telegram bot webhook set to ${webhookUrl}`);
    } catch (error) {
      logger.error("Error initializing Telegram bot webhook:", error);
      throw error;
    }
  }

  private async handleMessage(ctx: any) {
    try {
      const telegramId = ctx.from.id;

      // Check if we already have this user
      const existingUser = await User.findOne({
        where: sequelize.literal(
          `JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`
        ),
      });

      if (!existingUser) {
        // Create a new user with random data
        const randomUser = generateRandomUser();

        const newUser = await User.create({
          username: randomUser.username,
          email: randomUser.email,
          fullName: randomUser.fullName,
          phoneNumber: randomUser.phoneNumber,
          isActive: true,
          data: {
            telegram: {
              id: telegramId,
            },
          },
        });

        logger.info(
          `Created new user from Telegram chat: ${newUser.username} with telegramId: ${telegramId}`
        );
      }

      // Continue with normal message processing
      // If it's not a command, then we process the message here
      if (!ctx.message.text.startsWith("/")) {
        await ctx.reply(
          "Thanks for your message! Use /help to see available commands."
        );
      }
    } catch (error) {
      logger.error("Error handling Telegram message:", error);
    }
  }

  private async handleStartCommand(ctx: any) {
    await ctx.reply(
      "Welcome to the Course Reminder Bot! 👋\n\n" +
        "I can send you reminders about your courses and tryout sessions.\n\n" +
        "Use /register <username> to link your account with this Telegram chat.\n\n" +
        "For more information, type /help."
    );
  }

  private async handleHelpCommand(ctx: any) {
    await ctx.reply(
      "Course Reminder Bot Help 📚\n\n" +
        "Commands:\n" +
        "/start - Start the bot and get a welcome message\n" +
        "/register <username> - Link your account with this Telegram chat\n" +
        "/help - Show this help message\n\n" +
        "Once registered, you will receive automated reminders about your courses and tryout sessions."
    );
  }

  async handleReminderMessage(ctx: any) {
    await ctx.reply(
      "You have a course or tryout session today! Remember to check your calendar!"
    );
  }

  private async handleRegisterCommand(ctx: any) {
    const message = ctx.message.text.trim();
    const parts = message.split(" ");

    if (parts.length !== 2) {
      await ctx.reply("Please provide your username: /register <username>");
      return;
    }

    const username = parts[1];
    const telegramId = ctx.from.id;

    try {
      const user = await User.findOne({ where: { username } });

      if (!user) {
        await ctx.reply(
          `User with username ${username} not found. Please check your username and try again.`
        );
        return;
      }

      // Update user with telegramId
      user.setTelegramId(telegramId);
      await user.save();

      await ctx.reply(
        `Successfully registered! Your account (${username}) is now linked to this Telegram chat.`
      );
    } catch (error) {
      logger.error("Error registering user with Telegram:", error);
      await ctx.reply(
        "An error occurred during registration. Please try again later."
      );
    }
  }

  async sendMessage(telegramId: number, text: string, options: any = {}) {
    try {
      // Add debug logging
      logger.info(`Attempting to send Telegram message to ${telegramId}`, {
        textLength: text.length,
        first50Chars: text.substring(0, 50)
      });
  
      const result = await bot.api.sendMessage(telegramId, text, options);
      logger.debug(`Sending to telegramId: ${telegramId}`);
      
      // Verify Telegram API response
      if (!result?.message_id) {
        throw new Error('Telegram API returned invalid response');
      }
  
      logger.info(`Telegram message delivered to ${telegramId}`, {
        messageId: result.message_id
      });
      return true;
    } catch (error) {
      logger.error(`Failed to send Telegram message to ${telegramId}:`, {
        error: (error as any).response?.data ?? (error as any).message,
        textLength: text.length
      });
      throw error;
    }
  }

  async sendReminderToUser(userId: number, content: string) {
    const user = await User.findByPk(userId);
    if (!user?.isActive) {
      logger.warn(
        `Unable to send Telegram message to user ID ${userId}: User not found or inactive`
      );
      return null;
    }

    const telegramId = user.getTelegramId();
    if (!telegramId) {
      logger.warn(
        `Unable to send Telegram message to user ID ${userId}: No Telegram ID found in data field`
      );
      return null;
    }

    return this.sendMessage(Number(telegramId), content);
  }

  
  async sendReminderToAllUsers(content: string) {
    logger.info(`sendReminderToAllUsers with content: ${content}`);
    const users = await User.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') IS NOT NULL`),
        ],
      },
    });

    if (users.length === 0) {
      logger.warn("No active users with Telegram IDs found");
      return [];
    }

    const results = [];
    for (const user of users) {
      try {
        const telegramId = user.getTelegramId();
        logger.info(
          `Sending to user ${user.username} (telegramId: ${telegramId})`
        );
        if (telegramId) {
          await this.sendMessage(Number(telegramId), content);
          logger.info(`✅ Sent to ${user.username}`);
        }
        results.push({
          userId: user.id,
          username: user.username,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        results.push({
          userId: user.id,
          username: user.username,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return results;
  }

  async sendReminderToSpecificUser(username: string, content: string) {
    logger.debug(`sendReminderToSpecificUser to user ${username}`);
    try {
      const user = await User.findOne({ 
        where: { username },
        attributes: ['id', 'username', 'data']
      });
      
      if (!user) {
        logger.error(`Telegram send failed: User ${username} not found`);
        return null;
      }
  
      const telegramId = user.getTelegramId();
      if (!telegramId) {
        logger.error(`Telegram send failed: User ${username} has no Telegram ID`);
        return null;
      }
  
      // Verify the chat exists
      try {
        const chat = await bot.api.getChat(telegramId);
        logger.info(`Verified Telegram chat for ${username}:`, {
          chatId: chat.id,
          chatType: chat.type
        });
      } catch (error) {
        logger.error(`Invalid Telegram chat for ${username}:`, {
          telegramId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return null;
      }
  
      return await this.sendMessage(telegramId, content);
    } catch (error) {
      logger.error(`Error sending Telegram to ${username}:`, error);
      throw error;
    }
  }
  
}


import { Op } from "sequelize";
import sequelize from "../config/database";
export default new TelegramService();
