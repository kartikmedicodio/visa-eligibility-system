import express from 'express';
import * as documentController from '../controllers/documentController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/:id', documentController.getDocument);
router.post('/:id/process', documentController.processDocument);

export default router;

