import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: 'Access token is missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'soulful_baking_super_secret_key_12345', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token is invalid or expired' });
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
};

export {
  authenticateToken,
  requireAdmin
};
