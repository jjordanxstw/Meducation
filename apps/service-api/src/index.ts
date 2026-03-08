/**
 * Medical Learning Portal - API Service Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { subjectsRouter } from './routes/subjects.routes.js';
import { sectionsRouter } from './routes/sections.routes.js';
import { lecturesRouter } from './routes/lectures.routes.js';
import { resourcesRouter } from './routes/resources.routes.js';
import { calendarRouter } from './routes/calendar.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { profilesRouter } from './routes/profiles.routes.js';

const app: ReturnType<typeof express> = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/', limiter);

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profiles', profilesRouter);
app.use('/api/v1/subjects', subjectsRouter);
app.use('/api/v1/sections', sectionsRouter);
app.use('/api/v1/lectures', lecturesRouter);
app.use('/api/v1/resources', resourcesRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/audit-logs', auditRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use(errorHandler);

// =====================================================
// SERVER START
// =====================================================

app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Medical Learning Portal - API Service                 ║
║     Environment: ${config.isDev ? 'Development' : 'Production'}                           ║
║     Port: ${config.port}                                            ║
║     Ready at: http://localhost:${config.port}                       ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
