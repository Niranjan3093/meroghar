import dotenv from 'dotenv';
import express from 'express';

import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { setupSocketIO } from './socket/index.js';
import { startCronJobs, setIOInstance } from './cron/index.js';
import configurePassport from './config/passport.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import leaseRoutes from './routes/leaseRoutes.js';
import leaseRequestRoutes from './routes/leaseRequestRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import visitSittingRoutes from './routes/visitSittingRoutes.js';

// Load env vars
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'meroghar-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport initialization
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/lease-requests', leaseRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/visit-sittings', visitSittingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MeroGhar API is running' });
});

// Error Handler
app.use(errorHandler);

// Setup Socket.IO
setupSocketIO(io);

// Start cron jobs with io instance
setIOInstance(io);
startCronJobs();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

let tryPort = PORT;
const startServer = () => {
  httpServer.listen(tryPort, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${tryPort}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${tryPort} is already in use. Trying port ${tryPort + 1}...`);
      tryPort++;
      if (tryPort > PORT + 10) {
        console.error('Could not find an available port after trying 10 ports');
        process.exit(1);
      }
      startServer();
    } else {
      throw err;
    }
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
