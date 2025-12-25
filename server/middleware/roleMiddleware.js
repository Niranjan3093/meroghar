// Check if user has required role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is host
export const isHost = (req, res, next) => {
  if (req.userRole !== 'host' && req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Host or Admin access required'
    });
  }
  next();
};

// Check if user is verified
export const isVerified = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Import User model dynamically to avoid circular dependency
    const { default: User } = await import('../model/user.js');
    
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email to access this resource.'
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification check'
    });
  }
};
