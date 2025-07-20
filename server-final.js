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
const { validateUpload, validateVerify } = require('./middleware/validation');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        contract: process.env.CONTRACT_ADDRESS,
        network: 'BSC Testnet'
    });
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), validateUpload, async (req, res) => {
    try {
        const { productId } = req.body;
        const file = req.file;

        console.log(`Processing upload for product: ${productId}`);

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

        // Generate QR code
        const qrCodeData = qrService.generateQRData(productId, process.env.CONTRACT_ADDRESS);
        const qrCodeBase64 = await qrcode.toDataURL(qrCodeData);

        res.json({
            success: true,
            productId,
            fileHash,
            greenfieldUrl,
            txHash,
            qrCode: qrCodeBase64,
            qrCodeData,
            contractAddress: process.env.CONTRACT_ADDRESS
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error during upload'
        });
    }
});

// Verify endpoint
app.post('/api/verify', validateVerify, async (req, res) => {
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

// Get product info endpoint
app.get('/api/product/:productId', async (req, res) => {
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

// QR code generation endpoint
app.post('/api/qr/generate', async (req, res) => {
    try {
        const { productId, contractAddress, metadata } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'productId is required'
            });
        }

        const contractAddr = contractAddress || process.env.CONTRACT_ADDRESS;
        if (!contractAddr) {
            return res.status(400).json({
                success: false,
                error: 'Contract address not provided'
            });
        }

        // Generate QR data
        const qrData = qrService.generateQRData(productId, contractAddr);
        
        // Generate QR code as base64
        const qrCodeBase64 = await qrcode.toDataURL(qrData);

        // Create metadata
        const qrMetadata = qrService.createQRMetadata(
            productId,
            metadata?.manufacturer,
            metadata?.productName
        );

        res.json({
            success: true,
            productId,
            qrCode: qrCodeBase64,
            qrData: JSON.parse(qrData),
            metadata: qrMetadata
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate QR code'
        });
    }
});

// Serve frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler (without problematic wildcard pattern)
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
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⛓️  Contract: ${process.env.CONTRACT_ADDRESS}`);
});

module.exports = app;
