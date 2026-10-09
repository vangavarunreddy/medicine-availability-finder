import express from 'express';
import {
  getVendors,
  getPendingVendors,
  getVendorStats,
  getVendorById,
  approveVendor,
  rejectVendor
} from '../controllers/adminVendorController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All Admin Vendor routes require Token Authentication and ADMIN Role
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/vendors', getVendors);
router.get('/vendors/pending', getPendingVendors);
router.get('/vendors/stats', getVendorStats);
router.get('/vendors/:id', getVendorById);
router.patch('/vendors/:id/approve', approveVendor);
router.patch('/vendors/:id/reject', rejectVendor);

export default router;
