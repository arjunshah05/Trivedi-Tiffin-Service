import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import tiffinRoutes from './modules/tiffins/tiffin.routes.js';
import pricingRoutes from './modules/pricing/pricing.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1); 
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    service: 'trivedi-tiffin-api',
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/tiffins', tiffinRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/admin/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;