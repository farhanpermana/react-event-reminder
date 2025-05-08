// src/routes/courseRoutes.ts
import { Router } from 'express';
import courseController from '../controllers/course.controller';

const router = Router();

router.get('/', courseController.getAll);
router.get('/:id', courseController.getById);
router.post('/', courseController.create);
router.put('/:id', courseController.update);
router.delete('/:id', courseController.delete);

export default router;
