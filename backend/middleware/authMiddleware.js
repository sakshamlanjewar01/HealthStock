import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Unauthenticated Session. Please login.' 
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('CRITICAL CONFIGURATION ERROR: process.env.JWT_SECRET is not configured.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Retrieve user and check if account still exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: User account belonging to this token no longer exists.'
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Session token expired or invalid.' 
    });
  }
};

// Restrict access to specific roles (RBAC Authorization)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to perform this action.'
      });
    }
    next();
  };
};

