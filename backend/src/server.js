import './config/env.js';
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import adminVendorRoutes from './routes/adminVendorRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import notifyRoutes from './routes/notifyRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

// Security & Parsing Middlewares
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:5001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminVendorRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notify', notifyRoutes);

// Root route welcome
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Medicine Availability Finder API Server',
    healthCheck: '/api/health'
  });
});

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP Server
app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  console.log(`[API Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
