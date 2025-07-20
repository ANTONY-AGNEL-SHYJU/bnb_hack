// Simple authentication utility functions for initial testing
const crypto = require('crypto');

class SimpleAuth {
    constructor() {
        // Simple hash function using crypto
        this.users = new Map();
        this.sessions = new Map();
        
        // Add demo users
        this.addDemoUser('manufacturer@techcorp.com', 'demo123', 'manufacturer', 'TechCorp Manufacturing');
        this.addDemoUser('supplier@logistics.com', 'demo123', 'supplier', 'Global Logistics');
    }

    addDemoUser(email, password, role, fullName) {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const userId = Date.now().toString() + Math.random().toString(36);
        
        this.users.set(email, {
            id: userId,
            email,
            password: hashedPassword,
            role,
            fullName,
            verified: true,
            createdAt: new Date().toISOString(),
            blockchainHashes: []
        });
    }

    async loginUser(email, password) {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const user = this.users.get(email);
        
        if (!user || user.password !== hashedPassword) {
            throw new Error('Invalid credentials');
        }

        const token = crypto.randomBytes(32).toString('hex');
        this.sessions.set(token, {
            userId: user.id,
            email: user.email,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });

        const { password: _, ...userResponse } = user;
        return { user: userResponse, token };
    }

    async verifyToken(token) {
        const session = this.sessions.get(token);
        if (!session || session.expiresAt < Date.now()) {
            throw new Error('Invalid token');
        }

        const user = Array.from(this.users.values()).find(u => u.id === session.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const { password: _, ...userResponse } = user;
        return userResponse;
    }

    async associateBlockchainHash(userId, hashData) {
        const user = Array.from(this.users.values()).find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        const hashRecord = {
            id: Date.now().toString(),
            ...hashData,
            timestamp: new Date().toISOString()
        };

        user.blockchainHashes.push(hashRecord);
        return hashRecord;
    }

    async logoutUser(token) {
        this.sessions.delete(token);
        return true;
    }
}

module.exports = new SimpleAuth();
