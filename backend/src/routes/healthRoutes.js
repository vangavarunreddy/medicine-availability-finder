import express from 'express';
import { checkHealth, checkDbHealth } from '../controllers/healthController.js';

const router = express.Router();

// GET /api/health
router.get('/health', checkHealth);

// GET /api/health/db
router.get('/health/db', checkDbHealth);

export default router;
