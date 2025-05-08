// src/controllers/courseController.ts
import { Request, Response } from 'express';
import { Course, TryoutSection } from '../models';
import logger from '../utils/logger';
import { Op } from 'sequelize';

class CourseController {
  async getAll(req: Request, res: Response) {
    try {
      const courses = await Course.findAll({
        order: [['startDate', 'ASC']],
      });
      return res.json(courses);
    } catch (error) {
      logger.error('Error getting courses:', error);
      return res.status(500).json({ error: 'Failed to retrieve courses' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await Course.findByPk(id, {
        include: [
          {
            model: TryoutSection,
            order: [['startDateTime', 'ASC']],
          },
        ],
      });
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      return res.json(course);
    } catch (error) {
      logger.error(`Error getting course ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to retrieve course' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { code, title, description, startDate, endDate } = req.body;
      
      if (!code || !title || !startDate || !endDate) {
        return res.status(400).json({ error: 'Code, title, startDate, and endDate are required fields' });
      }
      
      const existingCourse = await Course.findOne({
        where: { code },
      });
      
      if (existingCourse) {
        return res.status(409).json({ error: 'Course code already exists' });
      }
      
      const course = await Course.create({
        code: code.toUpperCase(),
        title,
        description,
        startDate,
        endDate,
        isActive: true,
      });
      
      return res.status(201).json(course);
    } catch (error) {
      logger.error('Error creating course:', error);
      return res.status(500).json({ error: 'Failed to create course' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, title, description, startDate, endDate, isActive } = req.body;
      
      const course = await Course.findByPk(id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      // Check if code already exists for another course
      if (code && code !== course.code) {
        const existingCourse = await Course.findOne({
          where: {
            id: { [Op.ne]: id },
            code,
          },
        });
        
        if (existingCourse) {
          return res.status(409).json({ error: 'Course code already exists for another course' });
        }
      }
      
      await course.update({
        ...(code && { code: code.toUpperCase() }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(isActive !== undefined && { isActive }),
      });
      
      return res.json(course);
    } catch (error) {
      logger.error(`Error updating course ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await Course.findByPk(id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      // Check if course has associated tryout sections
      const tryoutSections = await TryoutSection.findAll({
        where: { courseId: id },
      });
      
      if (tryoutSections.length > 0) {
        return res.status(409).json({ 
          error: 'Cannot delete course with associated tryout sections. Please delete the tryout sections first.' 
        });
      }
      
      await course.destroy();
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting course ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
  }
}

export default new CourseController();