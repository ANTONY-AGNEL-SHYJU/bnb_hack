const express = require('express');
const qrcode = require('qrcode');
const qrService = require('../services/qrService');
const blockchainService = require('../services/blockchainService');
const { validateQRScan } = require('../middleware/validation');

const router = express.Router();

/**
 * Generate QR code for a product
 * POST /api/qr/generate
 * Body: { productId, contractAddress?, metadata? }
 */
router.post('/generate', async (req, res) => {
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

/**
 * Parse and validate QR code data
 * POST /api/qr/parse
 * Body: { qrData }
 */
router.post('/parse', validateQRScan, async (req, res) => {
    try {
        const parsedData = req.qrData;

        // Validate QR data structure
        if (!qrService.validateQRData(parsedData)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR code data structure'
            });
        }

        // Check if product exists on blockchain
        const productExists = await blockchainService.productExists(parsedData.productId);

        res.json({
            success: true,
            qrData: parsedData,
            isValid: true,
            productExists,
            verificationUrl: qrService.generateVerificationUrl(parsedData.productId)
        });

    } catch (error) {
        console.error('QR parse error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to parse QR code'
        });
    }
});

/**
 * Scan QR code and get product information
 * POST /api/qr/scan
 * Body: { qrData }
 */
router.post('/scan', validateQRScan, async (req, res) => {
    try {
        const parsedData = req.qrData;

        // Get product information from blockchain
        const productInfo = await blockchainService.getProductInfo(parsedData.productId);

        if (!productInfo.fileHash) {
            return res.json({
                success: true,
                productId: parsedData.productId,
                found: false,
                message: 'Product not found on blockchain'
            });
        }

        res.json({
            success: true,
            productId: parsedData.productId,
            found: true,
            productInfo,
            contractAddress: parsedData.contractAddress,
            scanTimestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to scan QR code'
        });
    }
});

module.exports = router;
