// src/services/telegram.service.ts
import bot from "../config/telegram";
import { User } from "../models";
import logger from "../utils/logger";
import sequelize from "../config/database";
import { Op } from "sequelize";
import { generateRandomUser } from '../utils/helper'; // Import your helper

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Map to track users waiting for real email input for new registrations
const waitingForRealEmail = new Map<number, { username: string; generatedFullName: string; generatedPhoneNumber: string }>();

class TelegramService {
  async initialize() {
    try {
      const webhookUrl = process.env.NGROK_URL + "/telegram-bot";
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
      const messageText = ctx.message.text;

      // Check if a new user is waiting for their real email input
      if (waitingForRealEmail.has(telegramId)) {
        const registrationData = waitingForRealEmail.get(telegramId)!;
        const { username, generatedFullName, generatedPhoneNumber } = registrationData;

        // Validate email format
        if (!emailRegex.test(messageText)) {
          await ctx.reply("Please provide a valid email address (e.g., user@example.com).");
          return;
        }

        try {
          // Check if the username already exists
          const existingUserByUsername = await User.findOne({ where: { username } });
          if (existingUserByUsername) {
            await ctx.reply(
              `Username "${username}" is already taken. Please choose a different username and try again with /register <new_username>.`
            );
            waitingForRealEmail.delete(telegramId);
            return;
          }

          // Check if the Telegram ID is already associated with a user
          const existingUserByTelegramId = await User.findOne({
            where: sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`),
          });

          if (existingUserByTelegramId) {
            await ctx.reply(
              "This Telegram account is already linked to another user. You cannot register a new account with the same Telegram ID."
            );
            waitingForRealEmail.delete(telegramId);
            return;
          }

          // Create a new user with the provided and generated data
          await User.create({
            username: username,
            email: messageText, // User's real email
            fullName: generatedFullName,
            phoneNumber: generatedPhoneNumber,
            isActive: true,
            data: {
              telegram: {
                id: telegramId,
              },
            },
          });

          await ctx.reply(
            `Successfully registered as "${username}" with email ${messageText}! Your account is now linked to this Telegram chat.`
          );
          logger.info(`New user registered: ${username} with real email ${messageText}, generated name ${generatedFullName}, generated phone ${generatedPhoneNumber}, and telegramId ${telegramId}`);
          waitingForRealEmail.delete(telegramId);
          return;
        } catch (error) {
          logger.error("Error creating new user:", error);
          await ctx.reply(
            "An error occurred during registration. Please try again later."
          );
          waitingForRealEmail.delete(telegramId);
          return;
        }
      }

      // Handle messages from existing users (if any exist)
      const existingUser = await User.findOne({
        where: sequelize.literal(
          `JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`
        ),
      });

      if (!ctx.message.text.startsWith("/")) {
        if (!existingUser) {
          await ctx.reply(
            "You are not yet registered. Use /register <new_username> to create an account."
          );
          return;
        }
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
        "Use /register <new_username> to create a new account and link it with this Telegram chat.\n\n" +
        "For more information, type /help."
    );
  }

  private async handleHelpCommand(ctx: any) {
    await ctx.reply(
      "Course Reminder Bot Help 📚\n\n" +
        "Commands:\n" +
        "/start - Start the bot and get a welcome message\n" +
        "/register <new_username> - Create a new account by providing a username and then your real email.\n" +
        "/help - Show this help message\n\n" +
        "Once registered, you will receive automated reminders about your courses and tryout sessions via Telegram and email."
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
      await ctx.reply("Please provide a new username: /register <new_username>");
      return;
    }

    const newUsername = parts[1];
    const telegramId = ctx.from.id;

    try {
      // Check if the Telegram ID is already associated with a user
      const existingUserByTelegramId = await User.findOne({
        where: sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`),
      });

      if (existingUserByTelegramId) {
        await ctx.reply(
          "This Telegram account is already linked to another user. You cannot register a new account with the same Telegram ID."
        );
        return;
      }

      // Check if the username already exists
      const existingUserByUsername = await User.findOne({ where: { username: newUsername } });
      if (existingUserByUsername) {
        await ctx.reply(
          `Username "${newUsername}" is already taken. Please choose a different username and try again with /register <new_username>.`
        );
        return;
      }

      // Generate random user data
      const randomUser = generateRandomUser();

      // Store registration data and set waiting state for real email
      waitingForRealEmail.set(telegramId, {
        username: newUsername,
        generatedFullName: randomUser.fullName,
        generatedPhoneNumber: randomUser.phoneNumber,
      });

      await ctx.reply(
        `Okay! You want to register with the username "${newUsername}". For verification, please provide your real email address:`
      );
    } catch (error) {
      logger.error("Error during new user registration:", error);
      await ctx.reply(
        "An error occurred during registration. Please try again later."
      );
    }
  }

  async sendMessage(telegramId: number, text: string, options: any = {}) {
    try {
      logger.info(`Attempting to send Telegram message to ${telegramId}`, {
        textLength: text.length,
        first50Chars: text.substring(0, 50)
      });

      const result = await bot.api.sendMessage(telegramId, text, options);
      logger.debug(`Sending to telegramId: ${telegramId}`);

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

export default new TelegramService();