// Authentication routes
const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, role, companyName } = req.body;

        // Validation
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, password, and full name are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Role validation
        const allowedRoles = ['manufacturer', 'supplier', 'admin', 'user'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Allowed roles: ' + allowedRoles.join(', ')
            });
        }

        const user = await authService.registerUser({
            username,
            email,
            password,
            fullName,
            role: role || 'user',
            companyName: companyName || '',
            verified: false // Will be verified by admin or email
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: user
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const result = await authService.loginUser(email, password);

        res.json({
            success: true,
            message: 'Login successful',
            user: result.user,
            token: result.token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        await authService.logoutUser(token);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userStats = await authService.getUserStats(req.user.id);
        const blockchainHashes = await authService.getUserBlockchainHashes(req.user.id);

        res.json({
            success: true,
            user: {
                ...req.user,
                stats: userStats,
                blockchainHashes: blockchainHashes
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, companyName } = req.body;

        const updatedUser = await authService.updateUserProfile(req.user.id, {
            fullName,
            companyName
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});

// Get user's blockchain hashes
router.get('/hashes', authenticateToken, async (req, res) => {
    try {
        const hashes = await authService.getUserBlockchainHashes(req.user.id);

        res.json({
            success: true,
            hashes: hashes
        });

    } catch (error) {
        console.error('Get hashes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get blockchain hashes'
        });
    }
});

// Demo login endpoints for quick testing
router.post('/demo/manufacturer', async (req, res) => {
    try {
        const result = await authService.loginUser('manufacturer@techcorp.com', 'demo123');
        res.json({
            success: true,
            message: 'Demo manufacturer login successful',
            user: result.user,
            token: result.token
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/demo/supplier', async (req, res) => {
    try {
        const result = await authService.loginUser('supplier@logistics.com', 'demo123');
        res.json({
            success: true,
            message: 'Demo supplier login successful',
            user: result.user,
            token: result.token
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
