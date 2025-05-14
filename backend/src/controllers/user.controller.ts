// src/controllers/userController.ts
import { Request, Response } from "express";
import { User } from "../models";
import logger from "../utils/logger";
import { Op } from "sequelize";
import sequelize from "../config/database";

class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await User.findAll();
      return res.json(users);
    } catch (error) {
      logger.error("Error getting users:", error);
      return res.status(500).json({ error: "Failed to retrieve users" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      logger.error(`Error getting user ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to retrieve user" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { username, email, fullName, phoneNumber } = req.body;
      const telegramId = req.body.telegramId
        ? parseInt(req.body.telegramId, 10)
        : undefined;

      const validationError = this.validateCreateFields(
        username,
        email,
        fullName
      );
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const conflictError = await this.checkUserConflict({
        username,
        email,
        phoneNumber,
        telegramId,
      });
      if (conflictError) {
        return res.status(409).json({ error: conflictError });
      }

      const user = await User.create({
        username,
        email,
        fullName,
        phoneNumber,
        password: "default_password",
        data: telegramId ? { telegram: { id: telegramId } } : {},
        isActive: 1,
      });

      return res.status(201).json(user);
    } catch (error) {
      logger.error("Error creating user:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { username, email, fullName, phoneNumber, isActive } = req.body;
      const telegramId = req.body.telegramId
        ? parseInt(req.body.telegramId, 10)
        : undefined;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const conflictError = await this.checkUserConflict({
        username,
        email,
        phoneNumber,
        telegramId,
        excludeUserId: id,
      });

      if (conflictError) {
        return res.status(409).json({ error: conflictError });
      }

      const updateData: Partial<User> = {
        ...(username && { username }),
        ...(email && { email }),
        ...(fullName && { fullName }),
        ...(phoneNumber && { phoneNumber }),
        ...(isActive !== undefined && { isActive }),
      };

      if (telegramId !== undefined) {
        user.setTelegramId(telegramId);
        updateData.data = user.data;
      }

      await user.update(updateData);

      return res.json(user);
    } catch (error) {
      logger.error(`Error updating user ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await user.destroy();

      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting user ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  }

  async findByTelegramId(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;

      if (!telegramId) {
        return res.status(400).json({ error: "Telegram ID is required" });
      }

      const user = await User.findByTelegramId(parseInt(telegramId, 10));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      logger.error(
        `Error finding user by Telegram ID ${req.params.telegramId}:`,
        error
      );
      return res
        .status(500)
        .json({ error: "Failed to find user by Telegram ID" });
    }
  }

  private validateCreateFields(
    username?: string,
    email?: string,
    fullName?: string
  ): string | null {
    const missing: string[] = [];
    if (!username) missing.push("username");
    if (!email) missing.push("email");
    if (!fullName) missing.push("fullName");

    return missing.length > 0
      ? `${missing.join(", ")} are required fields`
      : null;
  }

  private async checkUserConflict({
    username,
    email,
    phoneNumber,
    telegramId,
    excludeUserId,
  }: {
    username?: string;
    email?: string;
    phoneNumber?: string;
    telegramId?: number;
    excludeUserId?: string | number;
  }): Promise<string | null> {
    const whereClause = this.buildConflictWhereClause({
      username,
      email,
      phoneNumber,
      telegramId,
      excludeUserId,
    });

    if (!whereClause[Op.or].length) return null;

    const existingUser = await User.findOne({ where: whereClause });
    if (!existingUser) return null;

    return this.getConflictMessages({
      existingUser,
      username,
      email,
      phoneNumber,
      telegramId,
    });
  }

  private buildConflictWhereClause({
    username,
    email,
    phoneNumber,
    telegramId,
    excludeUserId,
  }: {
    username?: string;
    email?: string;
    phoneNumber?: string;
    telegramId?: number;
    excludeUserId?: string | number;
  }) {
    const conditions: any[] = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (telegramId !== undefined) {
      conditions.push(
        sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`)
      );
    }

    const whereClause: any = { [Op.or]: conditions };
    if (excludeUserId) {
      whereClause.id = { [Op.ne]: excludeUserId };
    }

    return whereClause;
  }
  private getConflictMessages({
    existingUser,
    username,
    email,
    phoneNumber,
    telegramId,
  }: {
    existingUser: any;
    username?: string;
    email?: string;
    phoneNumber?: string;
    telegramId?: number;
  }): string | null {
    const messages: string[] = [];

    if (username && existingUser.username === username)
      messages.push("Username already exists");
    if (email && existingUser.email === email)
      messages.push("Email already exists");
    if (phoneNumber && existingUser.phoneNumber === phoneNumber)
      messages.push("Phone number already exists");
    if (
      telegramId !== undefined &&
      existingUser.getTelegramId?.() === telegramId
    ) {
      messages.push("Telegram ID already exists");
    }

    return messages.length ? messages.join(", ") : null;
  }
}

export default new UserController();
