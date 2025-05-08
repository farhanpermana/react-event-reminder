// src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route';
import courseRoutes from './course.route';
import tryoutSectionRoutes from './tryoutcourse.route';
import broadcastRoutes from './broadcast.route';
import webhookRoutes from './weebhook.route';

const router = Router();

router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/tryout-sections', tryoutSectionRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/webhook', webhookRoutes);

export default router;