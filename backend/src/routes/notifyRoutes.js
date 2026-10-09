import express from 'express';
import { subscribe, getSubscriptions, unsubscribe } from '../controllers/notifyController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Patient subscribes to "Notify Me When Available"
router.post('/', authorizeRoles('PATIENT'), subscribe);

// View active subscriptions
router.get('/', authorizeRoles('PATIENT'), getSubscriptions);

// Delete subscription
router.delete('/:id', authorizeRoles('PATIENT'), unsubscribe);

export default router;
