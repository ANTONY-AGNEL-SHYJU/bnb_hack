#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function updateEnvWithContractAddress() {
    console.log('📝 Contract Address Updater');
    console.log('============================\n');
    
    // Get contract address from command line argument
    const contractAddress = process.argv[2];
    
    if (!contractAddress) {
        console.log('❌ Please provide the contract address as an argument:');
        console.log('   node scripts/update-env.js 0xYourContractAddress');
        console.log('\nExample:');
        console.log('   node scripts/update-env.js 0x1234567890123456789012345678901234567890');
        return;
    }
    
    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        console.log('❌ Invalid contract address format');
        console.log('   Contract address should be 40 hex characters starting with 0x');
        return;
    }
    
    const envPath = path.join(__dirname, '../.env');
    
    try {
        // Read current .env file
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update CONTRACT_ADDRESS
        if (envContent.includes('CONTRACT_ADDRESS=')) {
            envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
        } else {
            envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
        }
        
        // Write back to .env file
        fs.writeFileSync(envPath, envContent);
        
        console.log('✅ Successfully updated .env file!');
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log('\n🎉 Your ScanChain project is now ready!');
        console.log('\nNext steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Test the API: npm run test:api');
        console.log(`3. View contract on BSCScan: https://testnet.bscscan.com/address/${contractAddress}`);
        
    } catch (error) {
        console.log('❌ Error updating .env file:', error.message);
    }
}

updateEnvWithContractAddress();
