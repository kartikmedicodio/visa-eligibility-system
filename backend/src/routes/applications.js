import express from 'express';
import * as applicationController from '../controllers/applicationController.js';

const router = express.Router();

router.post('/', applicationController.createApplication);
router.get('/:id', applicationController.getApplication);
router.put('/:id', applicationController.updateApplication);
router.post('/:id/process', applicationController.processApplicationDocuments);

export default router;

