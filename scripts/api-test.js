const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * API Test Script for ScanChain
 * Tests all endpoints with sample data
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 ScanChain API Test Suite');
    console.log('============================\n');

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        console.log('--------------------');
        
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health check passed');
        console.log(`📊 Status: ${healthResponse.data.status}`);
        console.log(`⏰ Timestamp: ${healthResponse.data.timestamp}\n`);

    } catch (error) {
        console.log('❌ Health check failed - Server might not be running');
        console.log('💡 Start the server with: npm start\n');
        return;
    }

    try {
        // Test 2: Upload File
        console.log('Test 2: File Upload');
        console.log('-------------------');
        
        const testFilePath = path.join(__dirname, '../test-data/sample-product.json');
        
        if (!fs.existsSync(testFilePath)) {
            console.log('❌ Test file not found:', testFilePath);
            return;
        }

        const formData = new FormData();
        formData.append('productId', 'TEST-PRODUCT-001');
        formData.append('file', fs.createReadStream(testFilePath));

        const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('✅ File upload successful');
        console.log(`📝 Product ID: ${uploadResponse.data.productId}`);
        console.log(`🔒 File Hash: ${uploadResponse.data.fileHash}`);
        console.log(`🌐 Greenfield URL: ${uploadResponse.data.greenfieldUrl}`);
        console.log(`⛓️  Transaction Hash: ${uploadResponse.data.txHash}`);
        console.log(`📱 QR Code generated: ${uploadResponse.data.qrCode ? 'Yes' : 'No'}\n`);

        // Store data for verification test
        const uploadData = uploadResponse.data;

        // Test 3: Verify Product
        console.log('Test 3: Product Verification');
        console.log('-----------------------------');
        
        const verifyResponse = await axios.post(`${BASE_URL}/api/verify`, {
            productId: uploadData.productId,
            greenfieldUrl: uploadData.greenfieldUrl
        });

        console.log('✅ Verification request successful');
        console.log(`🔍 Is Verified: ${verifyResponse.data.isVerified}`);
        console.log(`📝 Message: ${verifyResponse.data.message}`);
        console.log(`🔒 Stored Hash: ${verifyResponse.data.storedHash}`);
        console.log(`🔒 Current Hash: ${verifyResponse.data.currentHash}\n`);

        // Test 4: Get Product Info
        console.log('Test 4: Get Product Info');
        console.log('------------------------');
        
        const productResponse = await axios.get(`${BASE_URL}/api/product/${uploadData.productId}`);
        
        console.log('✅ Product info retrieved');
        console.log(`📝 Product ID: ${productResponse.data.productId}`);
        console.log(`🔒 File Hash: ${productResponse.data.fileHash}`);
        console.log(`👤 Owner: ${productResponse.data.owner}`);
        console.log(`⏰ Timestamp: ${productResponse.data.timestamp}\n`);

        // Test 5: QR Code Generation
        console.log('Test 5: QR Code Generation');
        console.log('---------------------------');
        
        const qrResponse = await axios.post(`${BASE_URL}/api/qr/generate`, {
            productId: uploadData.productId,
            contractAddress: '0x1234567890123456789012345678901234567890',
            metadata: {
                manufacturer: 'Test Manufacturer',
                productName: 'Test Product'
            }
        });

        console.log('✅ QR Code generated');
        console.log(`📱 QR Data: ${JSON.stringify(qrResponse.data.qrData)}`);
        console.log(`🏷️  Metadata: ${JSON.stringify(qrResponse.data.metadata)}\n`);

        // Test 6: QR Code Parsing
        console.log('Test 6: QR Code Parsing');
        console.log('-----------------------');
        
        const parseResponse = await axios.post(`${BASE_URL}/api/qr/parse`, {
            qrData: JSON.stringify(qrResponse.data.qrData)
        });

        console.log('✅ QR Code parsed');
        console.log(`✔️  Is Valid: ${parseResponse.data.isValid}`);
        console.log(`🔍 Product Exists: ${parseResponse.data.productExists}`);
        console.log(`🌐 Verification URL: ${parseResponse.data.verificationUrl}\n`);

    } catch (error) {
        console.log('❌ API test failed:', error.response?.data?.error || error.message);
        
        if (error.response?.status === 500) {
            console.log('💡 This might be expected if environment variables are not set');
            console.log('   The API includes fallbacks for development mode');
        }
    }

    console.log('🎉 API Test Suite Complete!');
    console.log('============================');
    console.log('Next steps:');
    console.log('1. Set up environment variables (.env file)');
    console.log('2. Deploy smart contract to BSC Testnet');
    console.log('3. Test with real blockchain integration');
    console.log('4. Build frontend application\n');
}

// Add axios to package.json if not already present
async function ensureDependencies() {
    const packageJson = require('../package.json');
    if (!packageJson.dependencies.axios) {
        console.log('📦 Installing axios for API testing...');
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec('npm install axios form-data', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Failed to install axios. Please run: npm install axios form-data');
                    reject(error);
                } else {
                    console.log('✅ axios installed successfully\n');
                    resolve();
                }
            });
        });
    }
}

// Run tests
if (require.main === module) {
    ensureDependencies()
        .then(() => testAPI())
        .catch(() => testAPI()); // Run anyway if axios install fails
}

module.exports = { testAPI };
