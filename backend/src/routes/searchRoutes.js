import express from 'express';
import { handleSearch, getSearchHistory } from '../controllers/searchController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/search - Public medicine availability search
router.get('/', handleSearch);

// GET /api/search/history - Authenticated user search history
router.get('/history', authenticateToken, getSearchHistory);

export default router;
