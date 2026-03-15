import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }

    if (req.user.isBanned) {
      res.status(403);
      return next(new Error(`Account has been banned. Reason: ${req.user.banReason || 'Violation of terms'}`));
    }

    if (!req.user.isActive) {
      res.status(403);
      return next(new Error('Account is inactive'));
    }

    if (!req.user.isVerified) {
      res.status(401);
      return next(new Error('Please verify your account'));
    }

    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};
