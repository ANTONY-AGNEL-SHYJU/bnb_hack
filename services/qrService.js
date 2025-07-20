class QRService {
    /**
     * Generate QR code data containing product information
     * @param {string} productId - Unique product identifier
     * @param {string} contractAddress - Smart contract address
     * @param {Object} metadata - Additional metadata
     * @returns {string} QR code data string
     */
    generateQRData(productId, contractAddress, metadata = {}) {
        const qrData = {
            productId: productId,
            contractAddress: contractAddress,
            timestamp: Date.now(),
            version: '2.0',
            platform: 'ScanChain-BNB',
            ...metadata
        };
        
        return JSON.stringify(qrData);
    }

    /**
     * Parse QR code data
     * @param {string} qrData - QR code data string
     * @returns {object} Parsed QR data
     */
    parseQRData(qrData) {
        try {
            const parsed = JSON.parse(qrData);
            
            // Validate required fields
            if (!parsed.productId || !parsed.contractAddress) {
                throw new Error('Invalid QR code: missing required fields');
            }
            
            return parsed;
        } catch (error) {
            throw new Error(`Failed to parse QR code: ${error.message}`);
        }
    }

    /**
     * Validate QR code data structure
     * @param {object} qrData - Parsed QR data
     * @returns {boolean} True if valid
     */
    validateQRData(qrData) {
        const requiredFields = ['productId', 'contractAddress'];
        
        for (const field of requiredFields) {
            if (!qrData[field] || typeof qrData[field] !== 'string') {
                return false;
            }
        }
        
        // Validate contract address format (basic Ethereum address check)
        if (!this.isValidEthereumAddress(qrData.contractAddress)) {
            return false;
        }
        
        return true;
    }

    /**
     * Basic Ethereum address validation
     * @param {string} address - Ethereum address
     * @returns {boolean} True if valid format
     */
    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Generate verification URL for frontend
     * @param {string} productId - Product identifier
     * @param {string} baseUrl - Base URL of the application
     * @returns {string} Verification URL
     */
    generateVerificationUrl(productId, baseUrl = 'https://scanchain.app') {
        return `${baseUrl}/verify?productId=${encodeURIComponent(productId)}`;
    }

    /**
     * Create QR code metadata for storage
     * @param {string} productId - Product identifier
     * @param {string} manufacturer - Manufacturer name
     * @param {string} productName - Product name
     * @returns {object} QR metadata
     */
    createQRMetadata(productId, manufacturer = '', productName = '') {
        return {
            productId,
            manufacturer,
            productName,
            createdAt: new Date().toISOString(),
            qrCodeVersion: '1.0',
            platform: 'ScanChain BNB'
        };
    }
}

module.exports = new QRService();
