import express from 'express';
import { createRequest, getRequests, updateRequestStatus } from '../controllers/requestController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Patient submits reservation request
router.post('/', authorizeRoles('PATIENT'), createRequest);

// View requests submitted (Patient) or received (Vendor / Admin)
router.get('/', getRequests);

// Vendor updates request status
router.patch('/:id/status', authorizeRoles('PHARMACY', 'MEDICAL_AGENCY'), updateRequestStatus);

export default router;
