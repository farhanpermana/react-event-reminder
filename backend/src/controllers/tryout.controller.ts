// src/controllers/tryoutSectionController.ts
import { Request, Response } from 'express';
import { TryoutSection, Course } from '../models';
import logger from '../utils/logger';
import { Op } from 'sequelize';

class TryoutSectionController {
  async getAll(req: Request, res: Response) {
    try {
      const tryoutSections = await TryoutSection.findAll({
        include: [Course],
        order: [['startDateTime', 'ASC']],
      });
      return res.json(tryoutSections);
    } catch (error) {
      logger.error('Error getting tryout sections:', error);
      return res.status(500).json({ error: 'Failed to retrieve tryout sections' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tryoutSection = await TryoutSection.findByPk(id, {
        include: [Course],
      });
      
      if (!tryoutSection) {
        return res.status(404).json({ error: 'Tryout section not found' });
      }
      
      return res.json(tryoutSection);
    } catch (error) {
      logger.error(`Error getting tryout section ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to retrieve tryout section' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { code, title, courseId, startDateTime, endDateTime } = req.body;
      
      if (!code || !title || !courseId || !startDateTime || !endDateTime) {
        return res.status(400).json({ 
          error: 'Code, title, courseId, startDateTime, and endDateTime are required fields' 
        });
      }
      
      // Check if course exists
      const course = await Course.findByPk(courseId);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      const existingTryoutSection = await TryoutSection.findOne({
        where: { code },
      });
      
      if (existingTryoutSection) {
        return res.status(409).json({ error: 'Tryout section code already exists' });
      }
      
      const tryoutSection = await TryoutSection.create({
        code: code.toUpperCase(),
        title,
        courseId,
        startDateTime,
        endDateTime,
        isActive: true,
      });
      
      return res.status(201).json(tryoutSection);
    } catch (error) {
      logger.error('Error creating tryout section:', error);
      return res.status(500).json({ error: 'Failed to create tryout section' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, title, courseId, startDateTime, endDateTime, isActive } = req.body;
      
      const tryoutSection = await TryoutSection.findByPk(id);
      
      if (!tryoutSection) {
        return res.status(404).json({ error: 'Tryout section not found' });
      }
      
      // Check if code already exists for another tryout section
      if (code && code !== tryoutSection.code) {
        const existingTryoutSection = await TryoutSection.findOne({
          where: {
            id: { [Op.ne]: id },
            code,
          },
        });
        
        if (existingTryoutSection) {
          return res.status(409).json({ error: 'Tryout section code already exists for another tryout section' });
        }
      }
      
      // Check if course exists if courseId is provided
      if (courseId && courseId !== tryoutSection.courseId) {
        const course = await Course.findByPk(courseId);
        
        if (!course) {
          return res.status(404).json({ error: 'Course not found' });
        }
      }
      
      await tryoutSection.update({
        ...(code && { code: code.toUpperCase() }),
        ...(title && { title }),
        ...(courseId && { courseId }),
        ...(startDateTime && { startDateTime }),
        ...(endDateTime && { endDateTime }),
        ...(isActive !== undefined && { isActive }),
      });
      
      return res.json(tryoutSection);
    } catch (error) {
      logger.error(`Error updating tryout section ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update tryout section' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tryoutSection = await TryoutSection.findByPk(id);
      
      if (!tryoutSection) {
        return res.status(404).json({ error: 'Tryout section not found' });
      }
      
      await tryoutSection.destroy();
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting tryout section ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete tryout section' });
    }
  }
}

export default new TryoutSectionController();