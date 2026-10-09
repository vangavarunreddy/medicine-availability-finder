import express from 'express';
import {
  getInventory,
  getInventoryStats,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../controllers/inventoryController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All Vendor Inventory routes require Token Authentication and APPROVED PHARMACY/MEDICAL_AGENCY Role
router.use(authenticateToken);
router.use(authorizeRoles('PHARMACY', 'MEDICAL_AGENCY'));

router.get('/', getInventory);
router.get('/stats', getInventoryStats);
router.post('/', addInventoryItem);
router.patch('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
