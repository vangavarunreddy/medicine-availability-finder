import express from 'express';
import { getVendorMe, getPublicVendor } from '../controllers/vendorController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected Vendor route for authenticated Pharmacy/Agency
router.get('/me', authenticateToken, authorizeRoles('PHARMACY', 'MEDICAL_AGENCY'), getVendorMe);

// Public lookup route (only returns details if APPROVED)
router.get('/:id', getPublicVendor);

export default router;
