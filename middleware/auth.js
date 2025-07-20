// Authentication middleware
const authService = require('../services/auth');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const user = await authService.verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

// Middleware to check user role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (!req.user.verified) {
        return res.status(403).json({
            success: false,
            error: 'Account verification required'
        });
    }

    next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const user = await authService.verifyToken(token);
            req.user = user;
        }
    } catch (error) {
        // Continue without authentication
        console.log('Optional auth failed:', error.message);
    }
    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireVerification,
    optionalAuth
};
