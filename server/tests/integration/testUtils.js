import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import { enforceMaintenanceMode } from '../../middleware/maintenanceMiddleware.js';
import User from '../../models/User.js';
import Property from '../../models/Property.js';

export const TEST_DB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/meroghar_integration_test';

export const setTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
};

export const connectTestDb = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
};

export const cleanupTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
};

export const createTestApp = ({ authRoutes, propertyRoutes, leaseRequestRoutes, paymentRoutes }) => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(enforceMaintenanceMode);
  app.set('io', { to: () => ({ emit: () => {} }) });
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/lease-requests', leaseRequestRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use(errorHandler);
  return app;
};

export const seedMinimalData = async () => {
  await User.deleteMany({});
  await Property.deleteMany({});

  const host = await User.create({
    name: 'Host User',
    email: 'host.flow@example.com',
    password: 'Password123',
    role: 'host',
    isVerified: true,
    emailVerified: true,
    isActive: true
  });

  const tenant = await User.create({
    name: 'Tenant User',
    email: 'tenant.flow@example.com',
    password: 'Password123',
    role: 'tenant',
    isVerified: true,
    emailVerified: true,
    isActive: true
  });

  const property = await Property.create({
    host: host._id,
    title: 'Flow Test Apartment',
    description: 'Integration test property',
    propertyType: 'apartment',
    address: { street: 'Main St', city: 'Kathmandu', country: 'Nepal' },
    rent: 25000,
    securityDeposit: 50000,
    availableFrom: new Date('2026-05-01'),
    status: 'active',
    verificationStatus: 'verified'
  });

  host.properties = [property._id];
  await host.save();

  return { host, tenant, property };
};
