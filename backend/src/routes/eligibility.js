import express from 'express';
import * as eligibilityController from '../controllers/eligibilityController.js';

const router = express.Router();

router.post('/check', eligibilityController.checkEligibility);
router.get('/:applicationId', eligibilityController.getEligibilityResults);

export default router;

