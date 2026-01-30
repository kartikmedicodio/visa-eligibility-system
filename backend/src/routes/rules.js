import express from 'express';
import * as rulesController from '../controllers/rulesController.js';

const router = express.Router();

router.post('/scrape', rulesController.scrapeRules);
router.get('/', rulesController.listAllRules);
router.get('/:visaType', rulesController.getRules);

export default router;

