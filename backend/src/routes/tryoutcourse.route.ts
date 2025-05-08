// src/routes/tryoutSectionRoutes.ts
import { Router } from 'express';
import tryoutSectionController from '../controllers/tryout.controller';

const router = Router();

router.get('/', tryoutSectionController.getAll);
router.get('/:id', tryoutSectionController.getById);
router.post('/', tryoutSectionController.create);
router.put('/:id', tryoutSectionController.update);
router.delete('/:id', tryoutSectionController.delete);

export default router;