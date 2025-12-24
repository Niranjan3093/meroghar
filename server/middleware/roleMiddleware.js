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
export const isVerified = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // You would need to fetch the user and check verified status
  // For now, we'll just continue - you can enhance this later
  next();
};
