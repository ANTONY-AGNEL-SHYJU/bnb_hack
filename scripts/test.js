const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Utils = require('../utils');

/**
 * Test script to demonstrate ScanChain functionality
 */

async function runTests() {
    console.log('🧪 ScanChain Test Suite');
    console.log('=======================\n');

    // Test 1: Hash Generation
    console.log('Test 1: File Hash Generation');
    console.log('-----------------------------');
    
    // Create test file
    const testData = JSON.stringify({
        productName: 'Test Product',
        manufacturer: 'Test Manufacturer',
        batchNumber: 'BATCH-001',
        productionDate: '2025-01-01',
        specifications: {
            weight: '1kg',
            dimensions: '10x10x10cm',
            color: 'blue'
        }
    }, null, 2);
    
    const testBuffer = Buffer.from(testData);
    const fileHash = Utils.generateFileHash(testBuffer);
    
    console.log(`✅ Generated hash: ${fileHash}`);
    console.log(`📊 File size: ${Utils.formatFileSize(testBuffer.length)}\n`);

    // Test 2: Product ID Generation
    console.log('Test 2: Product ID Generation');
    console.log('------------------------------');
    
    const productId = Utils.generateProductId();
    console.log(`✅ Generated Product ID: ${productId}`);
    console.log(`✅ Is valid format: ${/^[A-Z0-9]{12}$/.test(productId)}\n`);

    // Test 3: Ethereum Address Validation
    console.log('Test 3: Address Validation');
    console.log('---------------------------');
    
    const validAddress = '0x1234567890123456789012345678901234567890';
    const invalidAddress = 'invalid-address';
    
    console.log(`✅ Valid address check: ${Utils.isValidEthereumAddress(validAddress)}`);
    console.log(`❌ Invalid address check: ${Utils.isValidEthereumAddress(invalidAddress)}\n`);

    // Test 4: File Type Validation
    console.log('Test 4: File Type Validation');
    console.log('-----------------------------');
    
    const pdfFile = 'document.pdf';
    const jsonFile = 'data.json';
    const txtFile = 'readme.txt';
    
    console.log(`✅ PDF file: ${Utils.validateFileType(pdfFile)}`);
    console.log(`✅ JSON file: ${Utils.validateFileType(jsonFile)}`);
    console.log(`❌ TXT file: ${Utils.validateFileType(txtFile)}\n`);

    // Test 5: Filename Sanitization
    console.log('Test 5: Filename Sanitization');
    console.log('------------------------------');
    
    const dirtyFilename = 'My Product@#$%^&*()!.pdf';
    const cleanFilename = Utils.sanitizeFilename(dirtyFilename);
    
    console.log(`Original: ${dirtyFilename}`);
    console.log(`✅ Sanitized: ${cleanFilename}\n`);

    // Test 6: Unique Filename Generation
    console.log('Test 6: Unique Filename Generation');
    console.log('-----------------------------------');
    
    const uniqueFilename = Utils.generateUniqueFilename('product-doc.pdf', productId);
    console.log(`✅ Unique filename: ${uniqueFilename}\n`);

    // Test 7: QR Service Tests
    console.log('Test 7: QR Service Tests');
    console.log('-------------------------');
    
    const qrService = require('../services/qrService');
    const contractAddress = '0x1234567890123456789012345678901234567890';
    
    const qrData = qrService.generateQRData(productId, contractAddress);
    console.log(`✅ QR Data: ${qrData}`);
    
    const parsedQR = qrService.parseQRData(qrData);
    console.log(`✅ Parsed QR:`, parsedQR);
    
    const isValidQR = qrService.validateQRData(parsedQR);
    console.log(`✅ QR Valid: ${isValidQR}\n`);

    // Test 8: Environment Variable Check
    console.log('Test 8: Environment Variables');
    console.log('------------------------------');
    
    const requiredEnvVars = [
        'GREENFIELD_ADDRESS',
        'GREENFIELD_PRIVATE_KEY',
        'CONTRACT_ADDRESS',
        'BSC_RPC_URL',
        'BSC_PRIVATE_KEY'
    ];
    
    console.log('Environment Variable Status:');
    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        const status = value ? '✅ Set' : '❌ Missing';
        const display = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'Not set';
        console.log(`   ${envVar}: ${status} (${display})`);
    });

    console.log('\n🎉 Test Suite Complete!');
    console.log('========================');
    console.log('Next steps:');
    console.log('1. Set up your environment variables in .env');
    console.log('2. Deploy the smart contract to BSC Testnet');
    console.log('3. Start the server with: npm start');
    console.log('4. Test the API endpoints with Postman or curl\n');
}

// Run tests
if (require.main === module) {
    require('dotenv').config();
    runTests().catch(console.error);
}

module.exports = { runTests };
