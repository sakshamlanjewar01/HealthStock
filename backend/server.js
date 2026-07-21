import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import { startCronJobs } from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || '',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5174'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log('[CORS Request Debug] Incoming Origin:', origin, 'Allowed Origins:', allowedOrigins);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
const isDev = process.env.NODE_ENV === 'development';
const clientUrl = process.env.CLIENT_URL || '';
const backendUrl = process.env.BACKEND_URL || '';

// Production separate-domain architecture: Frontend on Vercel, Backend on Render.
let clientDomain = '';
let backendDomain = '';

try {
  if (clientUrl) clientDomain = new URL(clientUrl).origin;
} catch (e) {
  console.warn('[CSP Setup] Invalid CLIENT_URL found in environment variables:', clientUrl);
}

try {
  if (backendUrl) backendDomain = new URL(backendUrl).origin;
} catch (e) {
  console.warn('[CSP Setup] Invalid BACKEND_URL found in environment variables:', backendUrl);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDev
        ? ["'self'", "'unsafe-inline'", "https://accounts.google.com"]
        : ["'self'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: isDev
        ? [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173",
          "http://localhost:3000",
          "ws://localhost:5173",
          "ws://localhost:3000",
          "https://*.googleapis.com",
          "https://updates.push.services.mozilla.com"
        ]
        : [
            "'self'",
            "https://healthstock.vercel.app",
            "https://healthstock-api.onrender.com",
            clientDomain, 
            backendDomain,
            "https://*.googleapis.com", 
            "https://updates.push.services.mozilla.com"
          ].filter(Boolean),
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting Config
const isDevMode = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevMode ? 5000 : 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevMode
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevMode ? 5000 : 30,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevMode
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);


// Database connection
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/healthstock';
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.log('Ensure MongoDB service is running locally, or update backend/.env');
    process.exit(1);
  }
};
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Healthstock API is online' });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected server error occurred.';

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    message = messages.join(', ');
    statusCode = 400;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    message = `Duplicate field value entered.`;
    statusCode = 400;
  }

  // Mongoose Cast Error (Invalid ID)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  console.error(`[Error Handler] ${statusCode} - ${message}`);
  res.status(statusCode).json({
    success: false,
    message: message
  });
});

// Start background cron jobs
startCronJobs();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Client App running at ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});
