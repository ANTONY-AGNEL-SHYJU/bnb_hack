// Authentication service with JSON-based user management
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

class AuthService {
    constructor() {
        this.usersFile = path.join(__dirname, '..', 'data', 'users.json');
        this.sessionsFile = path.join(__dirname, '..', 'data', 'sessions.json');
        this.jwtSecret = process.env.JWT_SECRET || 'scanchain_secret_key_2025';
        this.saltRounds = 12;
        
        // Initialize data files
        this.initializeDataFiles();
    }

    async initializeDataFiles() {
        try {
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, '..', 'data');
            try {
                await fs.access(dataDir);
            } catch {
                await fs.mkdir(dataDir, { recursive: true });
            }

            // Initialize users.json if it doesn't exist
            try {
                await fs.access(this.usersFile);
            } catch {
                const initialUsers = {
                    users: [],
                    lastUserId: 0
                };
                await fs.writeFile(this.usersFile, JSON.stringify(initialUsers, null, 2));
            }

            // Initialize sessions.json if it doesn't exist
            try {
                await fs.access(this.sessionsFile);
            } catch {
                const initialSessions = {
                    sessions: [],
                    lastSessionId: 0
                };
                await fs.writeFile(this.sessionsFile, JSON.stringify(initialSessions, null, 2));
            }

            // Create demo users for testing
            await this.createDemoUsers();
        } catch (error) {
            console.error('Error initializing auth data files:', error);
        }
    }

    async createDemoUsers() {
        const users = await this.loadUsers();
        
        // Check if demo users already exist
        const demoManufacturer = users.users.find(u => u.email === 'manufacturer@techcorp.com');
        const demoSupplier = users.users.find(u => u.email === 'supplier@logistics.com');

        if (!demoManufacturer) {
            await this.registerUser({
                username: 'techcorp_mfg',
                email: 'manufacturer@techcorp.com',
                password: 'demo123',
                fullName: 'TechCorp Manufacturing',
                role: 'manufacturer',
                companyName: 'TechCorp Industries',
                verified: true
            });
        }

        if (!demoSupplier) {
            await this.registerUser({
                username: 'logistics_supplier',
                email: 'supplier@logistics.com',
                password: 'demo123',
                fullName: 'Global Logistics Supplier',
                role: 'supplier',
                companyName: 'Global Logistics Inc',
                verified: true
            });
        }
    }

    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading users:', error);
            return { users: [], lastUserId: 0 };
        }
    }

    async saveUsers(userData) {
        try {
            await fs.writeFile(this.usersFile, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
            throw new Error('Failed to save user data');
        }
    }

    async loadSessions() {
        try {
            const data = await fs.readFile(this.sessionsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
            return { sessions: [], lastSessionId: 0 };
        }
    }

    async saveSessions(sessionData) {
        try {
            await fs.writeFile(this.sessionsFile, JSON.stringify(sessionData, null, 2));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    async registerUser(userData) {
        try {
            const users = await this.loadUsers();
            
            // Check if user already exists
            const existingUser = users.users.find(u => 
                u.email === userData.email || u.username === userData.username
            );
            
            if (existingUser) {
                throw new Error('User with this email or username already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
            
            // Create new user
            const newUser = {
                id: ++users.lastUserId,
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                fullName: userData.fullName,
                role: userData.role || 'user',
                companyName: userData.companyName || '',
                verified: userData.verified || false,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                blockchainHashes: [], // Store associated blockchain hashes
                profileData: {
                    totalBatches: 0,
                    totalScans: 0,
                    joinedAt: new Date().toISOString()
                }
            };

            users.users.push(newUser);
            await this.saveUsers(users);

            // Remove password from response
            const { password, ...userResponse } = newUser;
            return userResponse;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            const users = await this.loadUsers();
            const user = users.users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            await this.saveUsers(users);

            // Create JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role 
                },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            // Create session
            await this.createSession(user.id, token);

            // Remove password from response
            const { password: _, ...userResponse } = user;
            return {
                user: userResponse,
                token: token
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async createSession(userId, token) {
        try {
            const sessions = await this.loadSessions();
            
            const newSession = {
                id: ++sessions.lastSessionId,
                userId: userId,
                token: token,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                active: true
            };

            sessions.sessions.push(newSession);
            await this.saveSessions(sessions);
            
            return newSession;
        } catch (error) {
            console.error('Session creation error:', error);
        }
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            
            // Check if session exists and is active
            const sessions = await this.loadSessions();
            const session = sessions.sessions.find(s => 
                s.token === token && s.active && new Date(s.expiresAt) > new Date()
            );
            
            if (!session) {
                throw new Error('Invalid or expired session');
            }

            // Get user data
            const users = await this.loadUsers();
            const user = users.users.find(u => u.id === decoded.userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            const { password, ...userResponse } = user;
            return userResponse;
        } catch (error) {
            console.error('Token verification error:', error);
            throw new Error('Invalid token');
        }
    }

    async logoutUser(token) {
        try {
            const sessions = await this.loadSessions();
            const session = sessions.sessions.find(s => s.token === token);
            
            if (session) {
                session.active = false;
                session.loggedOutAt = new Date().toISOString();
                await this.saveSessions(sessions);
            }
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async associateBlockchainHash(userId, hashData) {
        try {
            const users = await this.loadUsers();
            const user = users.users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Add blockchain hash association
            const hashRecord = {
                id: Date.now().toString(),
                batchId: hashData.batchId,
                fileHash: hashData.fileHash,
                txHash: hashData.txHash,
                contractAddress: hashData.contractAddress,
                blockNumber: hashData.blockNumber,
                timestamp: new Date().toISOString(),
                productName: hashData.productName,
                verified: true
            };

            user.blockchainHashes.push(hashRecord);
            user.profileData.totalBatches++;
            
            await this.saveUsers(users);
            return hashRecord;
        } catch (error) {
            console.error('Error associating blockchain hash:', error);
            throw error;
        }
    }

    async getUserBlockchainHashes(userId) {
        try {
            const users = await this.loadUsers();
            const user = users.users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            return user.blockchainHashes || [];
        } catch (error) {
            console.error('Error getting user blockchain hashes:', error);
            throw error;
        }
    }

    async updateUserProfile(userId, profileData) {
        try {
            const users = await this.loadUsers();
            const user = users.users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Update allowed fields
            const allowedFields = ['fullName', 'companyName'];
            allowedFields.forEach(field => {
                if (profileData[field] !== undefined) {
                    user[field] = profileData[field];
                }
            });

            await this.saveUsers(users);
            
            const { password, ...userResponse } = user;
            return userResponse;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    async getUserStats(userId) {
        try {
            const users = await this.loadUsers();
            const user = users.users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            return {
                totalBatches: user.blockchainHashes.length,
                totalVerifiedHashes: user.blockchainHashes.filter(h => h.verified).length,
                joinedAt: user.createdAt,
                lastLogin: user.lastLogin,
                role: user.role,
                verified: user.verified
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();
