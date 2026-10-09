import express from 'express';
import {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine
} from '../controllers/medicineController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Authenticated Read Access
router.get('/', getMedicines);
router.get('/:id', getMedicine);

// Admin Only Catalog Management Routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createMedicine);
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN'), updateMedicine);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteMedicine);

export default router;
