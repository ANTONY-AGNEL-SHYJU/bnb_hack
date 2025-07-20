const { ethers } = require('ethers');

// Smart contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "productId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "fileHash",
                "type": "string"
            }
        ],
        "name": "storeProductHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "productId",
                "type": "string"
            }
        ],
        "name": "getProductHash",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "productId",
                "type": "string"
            }
        ],
        "name": "getProductInfo",
        "outputs": [
            {
                "internalType": "string",
                "name": "fileHash",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "productId",
                "type": "string"
            }
        ],
        "name": "productExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "productId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "fileHash",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "ProductStored",
        "type": "event"
    }
];

class BlockchainService {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.init();
    }

    init() {
        try {
            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(
                process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
            );

            // Initialize wallet only if private key is properly set
            if (process.env.BSC_PRIVATE_KEY && 
                process.env.BSC_PRIVATE_KEY !== 'your_bsc_testnet_private_key_here' &&
                process.env.BSC_PRIVATE_KEY.length > 0) {
                this.wallet = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, this.provider);
            } else {
                console.log('⚠️  BSC private key not configured - write operations will fail');
            }

            // Initialize contract only if address is properly set
            if (process.env.CONTRACT_ADDRESS && 
                process.env.CONTRACT_ADDRESS !== 'your_deployed_contract_address_here' &&
                process.env.CONTRACT_ADDRESS.length > 0) {
                this.contract = new ethers.Contract(
                    process.env.CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    this.wallet || this.provider
                );
            } else {
                console.log('⚠️  Contract address not configured - blockchain operations will use mock data');
            }

            console.log('✅ Blockchain service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain service:', error.message);
            console.log('⚠️  Using development mode with mock data');
        }
    }

    async storeProductHash(productId, fileHash) {
        try {
            if (!this.contract || !this.wallet) {
                throw new Error('Contract or wallet not initialized. Check CONTRACT_ADDRESS and BSC_PRIVATE_KEY environment variables.');
            }

            console.log(`Storing hash for product ${productId}: ${fileHash}`);

            // Estimate gas
            const gasEstimate = await this.contract.storeProductHash.estimateGas(productId, fileHash);
            const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

            // Send transaction
            const tx = await this.contract.storeProductHash(productId, fileHash, {
                gasLimit: gasLimit
            });

            console.log(`Transaction sent: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

            return tx.hash;

        } catch (error) {
            console.error('❌ Blockchain store error:', error);
            
            // For development, return a mock transaction hash
            if (process.env.NODE_ENV === 'development') {
                const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
                console.log('⚠️  Using mock transaction hash for development:', mockTxHash);
                return mockTxHash;
            }
            
            throw new Error(`Failed to store hash on blockchain: ${error.message}`);
        }
    }

    async getProductHash(productId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized. Check CONTRACT_ADDRESS environment variable.');
            }

            const hash = await this.contract.getProductHash(productId);
            return hash || null;

        } catch (error) {
            console.error('❌ Blockchain get error:', error);
            
            // For development, return a mock hash if productId is known
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️  Using mock hash for development');
                return 'mock_hash_for_development_' + productId;
            }
            
            throw new Error(`Failed to get hash from blockchain: ${error.message}`);
        }
    }

    async getProductInfo(productId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized. Check CONTRACT_ADDRESS environment variable.');
            }

            const [fileHash, owner, timestamp] = await this.contract.getProductInfo(productId);
            
            return {
                fileHash: fileHash || null,
                owner: owner !== '0x0000000000000000000000000000000000000000' ? owner : null,
                timestamp: timestamp ? Number(timestamp) : null
            };

        } catch (error) {
            console.error('❌ Blockchain get product info error:', error);
            
            // For development, return mock data
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️  Using mock product info for development');
                return {
                    fileHash: 'mock_hash_for_development_' + productId,
                    owner: '0x1234567890123456789012345678901234567890',
                    timestamp: Math.floor(Date.now() / 1000)
                };
            }
            
            throw new Error(`Failed to get product info from blockchain: ${error.message}`);
        }
    }

    async productExists(productId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized. Check CONTRACT_ADDRESS environment variable.');
            }

            return await this.contract.productExists(productId);

        } catch (error) {
            console.error('❌ Blockchain product exists error:', error);
            
            // For development, return true for any productId
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️  Assuming product exists for development');
                return true;
            }
            
            throw new Error(`Failed to check product existence: ${error.message}`);
        }
    }

    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            
            return {
                chainId: Number(network.chainId),
                name: network.name,
                blockNumber: blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to get network info:', error);
            throw error;
        }
    }
}

module.exports = new BlockchainService();
