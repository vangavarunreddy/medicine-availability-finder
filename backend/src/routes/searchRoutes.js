import express from 'express';
import { handleSearch } from '../controllers/searchController.js';

const router = express.Router();

// GET /api/search - Public medicine availability search
router.get('/', handleSearch);

export default router;
