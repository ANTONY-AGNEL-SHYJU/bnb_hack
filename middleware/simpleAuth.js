// Simple authentication middleware using basic crypto
const simpleAuth = require('../services/simpleAuth');

// Middleware to verify token
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

        const user = await simpleAuth.verifyToken(token);
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

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const user = await simpleAuth.verifyToken(token);
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
    optionalAuth
};
