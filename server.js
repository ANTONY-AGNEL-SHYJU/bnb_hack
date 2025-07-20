const express = require('express');
const multer = require('multer');
const crypto = require('crypto-js');
const qrcode = require('qrcode');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const greenfieldService = require('./services/greenfieldService');
const blockchainService = require('./services/blockchainService');
const qrService = require('./services/qrService');
const supplyChainDB = require('./services/database');
const authService = require('./services/auth');
const { validateUpload, validateVerify } = require('./middleware/validation');
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const qrRoutes = require('./routes/qr');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept PDF and JSON files
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/json' ||
            file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and JSON files are allowed'), false);
        }
    }
});

// Routes

// Authentication routes
app.use('/api/auth', authRoutes);

// QR code routes
app.use('/api/qr', qrRoutes);

/**
 * Health check endpoint - protected
 */
app.get('/api/health', authenticateToken, (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        contract: process.env.BSC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
    });
});

/**
 * Upload endpoint - Store file on Greenfield and hash on BSC
 * POST /api/upload
 * Body: multipart/form-data with productId and file
 */
/**
 * Upload file and create batch with authentication
 */
app.post('/api/upload', authenticateToken, upload.single('file'), validateUpload, async (req, res) => {
    try {
        const { productId, manufacturerName, batchName, productType, description } = req.body;
        const file = req.file;

        console.log(`Processing upload for batch: ${productId} by ${manufacturerName}`);

        // Generate SHA-256 hash of the file
        const fileBuffer = file.buffer;
        const fileHash = crypto.SHA256(crypto.lib.WordArray.create(fileBuffer)).toString();
        console.log(`Generated file hash: ${fileHash}`);

        // Store file on BNB Greenfield
        console.log('Uploading to Greenfield...');
        const greenfieldUrl = await greenfieldService.uploadFile(
            file.buffer,
            `${productId}-${Date.now()}.${file.originalname.split('.').pop()}`,
            file.mimetype
        );
        console.log(`File uploaded to Greenfield: ${greenfieldUrl}`);

        // Store hash on BSC
        console.log('Storing hash on BSC...');
        const txHash = await blockchainService.storeProductHash(productId, fileHash);
        console.log(`Hash stored on BSC. Transaction: ${txHash}`);

        // Store batch information in database with enhanced metadata
        const batchData = {
            manufacturerId: manufacturerName ? manufacturerName.toLowerCase().replace(/\s+/g, '_') : 'unknown',
            manufacturerName: manufacturerName || 'Unknown Manufacturer',
            batchName: batchName || productId,
            productType: productType || 'Unknown',
            description: description || '',
            fileHash,
            greenfieldUrl,
            txHash,
            contractAddress: process.env.CONTRACT_ADDRESS,
            documentUrl: greenfieldUrl, // Public view link
            userId: req.user.id, // Associate with authenticated user
            userEmail: req.user.email,
            // Additional file metadata
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadTimestamp: new Date().toISOString()
        };
        
        supplyChainDB.storeBatch(productId, batchData);

        // Associate blockchain hash with user
        await authService.associateBlockchainHash(req.user.id, {
            batchId: productId,
            fileHash,
            txHash,
            contractAddress: process.env.CONTRACT_ADDRESS,
            blockNumber: null, // Could be retrieved from blockchain
            productName: batchData.batchName
        });

        // Generate QR code with enhanced data
        const qrCodeData = qrService.generateQRData(productId, process.env.CONTRACT_ADDRESS, {
            batchName: batchData.batchName,
            manufacturer: batchData.manufacturerName,
            productType: batchData.productType
        });
        const qrCodeBase64 = await qrcode.toDataURL(qrCodeData);

        res.json({
            success: true,
            batchId: productId,
            manufacturerName: batchData.manufacturerName,
            batchName: batchData.batchName,
            fileHash,
            greenfieldUrl,
            txHash,
            qrCode: qrCodeBase64,
            qrCodeData,
            contractAddress: process.env.CONTRACT_ADDRESS,
            message: 'Batch created successfully! Share the QR code with your supply chain partners.'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error during upload'
        });
    }
});

/**
 * Verify endpoint - Check product authenticity
 * POST /api/verify
 * Body: { productId, greenfieldUrl }
 */
app.post('/api/verify', authenticateToken, validateVerify, async (req, res) => {
    try {
        const { productId, greenfieldUrl } = req.body;

        console.log(`Verifying product: ${productId}`);

        // Get stored hash from BSC
        console.log('Fetching hash from BSC...');
        const storedHash = await blockchainService.getProductHash(productId);
        
        if (!storedHash) {
            return res.json({
                success: true,
                isVerified: false,
                error: 'Product not found on blockchain',
                productId
            });
        }

        // Download file from Greenfield and calculate current hash
        console.log('Downloading file from Greenfield...');
        const fileBuffer = await greenfieldService.downloadFile(greenfieldUrl);
        const currentHash = crypto.SHA256(crypto.lib.WordArray.create(fileBuffer)).toString();
        console.log(`Current hash: ${currentHash}, Stored hash: ${storedHash}`);

        // Compare hashes
        const isVerified = storedHash === currentHash;

        res.json({
            success: true,
            isVerified,
            productId,
            storedHash,
            currentHash,
            message: isVerified ? 'Product is authentic' : 'Product has been tampered with'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error during verification'
        });
    }
});

/**
 * Get product info from blockchain
 * GET /api/product/:productId
 */

// QR Scan endpoint - For suppliers to scan and view batch info
app.post('/api/scan', authenticateToken, async (req, res) => {
    try {
        const { qrData, supplierName, supplierLocation } = req.body;

        if (!qrData || !supplierName) {
            return res.status(400).json({
                success: false,
                error: 'QR data and supplier name are required'
            });
        }

        // Parse QR data
        let parsedQR;
        try {
            parsedQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR code format'
            });
        }

        const batchId = parsedQR.productId;
        const batch = supplyChainDB.getBatch(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        // Record the scan
        const scanRecord = supplyChainDB.recordScan(batchId, {
            supplierName,
            supplierLocation: supplierLocation || 'Unknown',
            scanType: 'QR_SCAN',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            batchInfo: {
                batchId,
                batchName: batch.batchName,
                manufacturerName: batch.manufacturerName,
                productType: batch.productType,
                description: batch.description,
                documentUrl: batch.documentUrl,
                createdAt: batch.createdAt,
                contractAddress: batch.contractAddress,
                txHash: batch.txHash
            },
            scanRecord: {
                scanId: scanRecord.id,
                timestamp: scanRecord.timestamp,
                supplierName: scanRecord.supplierName
            },
            message: `Welcome ${supplierName}! Scan recorded successfully.`
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error during scan'
        });
    }
});

// Manufacturer Dashboard endpoint
app.get('/api/dashboard/:manufacturerId', authenticateToken, async (req, res) => {
    try {
        const { manufacturerId } = req.params;
        
        const dashboardData = supplyChainDB.getManufacturerDashboard(manufacturerId);
        
        res.json({
            success: true,
            manufacturerId,
            batches: dashboardData,
            totalBatches: dashboardData.length,
            totalScans: dashboardData.reduce((total, batch) => total + batch.scans.length, 0)
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get batch details endpoint
app.get('/api/batch/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        
        const batch = supplyChainDB.getBatch(batchId);
        
        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        res.json({
            success: true,
            batch: {
                batchId,
                ...batch
            }
        });

    } catch (error) {
        console.error('Get batch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get product info endpoint
app.get('/api/product/:productId', authenticateToken, async (req, res) => {
    try {
        const productId = req.params.productId;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        
        const productInfo = await blockchainService.getProductInfo(productId);
        
        if (!productInfo.fileHash) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            productId,
            ...productInfo
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get user metadata and uploads
app.get('/api/user/:userId/metadata', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Ensure user can only access their own data (or admin access)
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only view your own metadata.'
            });
        }
        
        const userMetadata = supplyChainDB.getUserMetadata(userId);
        
        res.json({
            success: true,
            userMetadata
        });

    } catch (error) {
        console.error('Get user metadata error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get current user's metadata
app.get('/api/user/metadata', authenticateToken, async (req, res) => {
    try {
        const userMetadata = supplyChainDB.getUserMetadata(req.user.id);
        
        res.json({
            success: true,
            userMetadata
        });

    } catch (error) {
        console.error('Get current user metadata error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Search products endpoint
app.get('/api/products/search', authenticateToken, async (req, res) => {
    try {
        const { q: query, criteria = 'all' } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        
        const results = supplyChainDB.searchProducts(query, criteria);
        
        res.json({
            success: true,
            query,
            criteria,
            results,
            total: results.length
        });

    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Serve frontend routes
// Root route - serve login page by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Home page - requires authentication
app.get('/home', optionalAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/verify', optionalAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

app.get('/upload', optionalAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/scan', optionalAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

app.get('/dashboard', optionalAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler - Fixed to avoid path-to-regexp error
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ScanChain server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
