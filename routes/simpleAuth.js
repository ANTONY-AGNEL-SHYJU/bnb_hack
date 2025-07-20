// Simple authentication routes using basic crypto
const express = require('express');
const router = express.Router();
const simpleAuth = require('../services/simpleAuth');

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

        const result = await simpleAuth.loginUser(email, password);

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

// Demo login endpoints
router.post('/demo/manufacturer', async (req, res) => {
    try {
        const result = await simpleAuth.loginUser('manufacturer@techcorp.com', 'demo123');
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
        const result = await simpleAuth.loginUser('supplier@logistics.com', 'demo123');
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

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token required'
            });
        }

        const user = await simpleAuth.verifyToken(token);

        res.json({
            success: true,
            message: 'Token is valid',
            user: user
        });

    } catch (error) {
        res.status(403).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            await simpleAuth.logoutUser(token);
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

module.exports = router;
