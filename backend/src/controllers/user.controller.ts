// src/controllers/userController.ts
import { Request, Response } from 'express';
import { User } from '../models';
import logger from '../utils/logger';

class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await User.findAll();
      return res.json(users);
    } catch (error) {
      logger.error('Error getting users:', error);
      return res.status(500).json({ error: 'Failed to retrieve users' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      logger.error(`Error getting user ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { username, email, fullName, telegramId, phoneNumber } = req.body;
      
      if (!username || !email || !fullName) {
        return res.status(400).json({ error: 'Username, email, and fullName are required fields' });
      }
      
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });
      
      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      
      // Initial empty data object
      const data: { telegram?: { id: string | number } } = {};
      
      // Add telegram data if telegramId is provided
      if (telegramId) {
        data.telegram = { id: telegramId };
      }
      
      const user = await User.create({
        username,
        email,
        fullName,
        phoneNumber,
        data,
        isActive: true,
      });
      
      return res.status(201).json(user);
    } catch (error) {
      logger.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { username, email, fullName, telegramId, phoneNumber, isActive } = req.body;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if username or email already exists for another user
      if (username || email) {
        const existingUser = await User.findOne({
          where: {
            id: { [Op.ne]: id },
            [Op.or]: [
              ...(username ? [{ username }] : []),
              ...(email ? [{ email }] : [])
            ]
          }
        });
        
        if (existingUser) {
          return res.status(409).json({ error: 'Username or email already exists for another user' });
        }
      }
      
      // Update telegram ID if provided
      if (telegramId !== undefined) {
        user.setTelegramId(telegramId);
      }
      
      await user.update({
        ...(username && { username }),
        ...(email && { email }),
        ...(fullName && { fullName }),
        ...(phoneNumber && { phoneNumber }),
        ...(isActive !== undefined && { isActive }),
        data: user.data, // Include the updated data with telegramId
      });
      
      return res.json(user);
    } catch (error) {
      logger.error(`Error updating user ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.destroy();
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting user ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async findByTelegramId(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;
      
      if (!telegramId) {
        return res.status(400).json({ error: 'Telegram ID is required' });
      }
      
      // Find user by telegramId stored in data.telegram.id
      const user = await User.findOne({
        where: sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`)
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      logger.error(`Error finding user by Telegram ID ${req.params.telegramId}:`, error);
      return res.status(500).json({ error: 'Failed to find user by Telegram ID' });
    }
  }
}

import { Op } from 'sequelize';
import sequelize from '../config/database';
export default new UserController();
