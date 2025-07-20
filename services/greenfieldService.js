const { Client } = require('@bnb-chain/greenfield-js-sdk');

class GreenfieldService {
    constructor() {
        this.client = null;
        this.bucketName = 'scanchain-bucket';
        this.init();
    }

    async init() {
        try {
            // Only initialize if credentials are properly configured
            if (process.env.GREENFIELD_ADDRESS && 
                process.env.GREENFIELD_ADDRESS !== 'your_greenfield_testnet_address_here' &&
                process.env.GREENFIELD_PRIVATE_KEY &&
                process.env.GREENFIELD_PRIVATE_KEY !== 'your_greenfield_private_key_here') {
                
                this.client = Client.create(
                    process.env.GREENFIELD_RPC_URL || 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443',
                    String(process.env.GREENFIELD_CHAIN_ID || '5600')
                );
                console.log('✅ Greenfield client initialized');
            } else {
                console.log('⚠️  Greenfield credentials not configured - using development mode');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Greenfield client:', error.message);
            console.log('⚠️  Using development mode with mock storage');
        }
    }

    async createBucketIfNotExists() {
        try {
            // Check if bucket exists
            const bucketInfo = await this.client.bucket.headBucket(this.bucketName);
            console.log('✅ Bucket already exists:', this.bucketName);
            return true;
        } catch (error) {
            // Bucket doesn't exist, create it
            try {
                const tx = await this.client.bucket.createBucket({
                    bucketName: this.bucketName,
                    creator: process.env.GREENFIELD_ADDRESS,
                    visibility: 1, // VISIBILITY_TYPE_PUBLIC_READ
                    chargedReadQuota: '0',
                    paymentAddress: process.env.GREENFIELD_ADDRESS,
                });
                
                console.log('✅ Bucket created successfully:', this.bucketName);
                return true;
            } catch (createError) {
                console.error('❌ Failed to create bucket:', createError);
                throw createError;
            }
        }
    }

    async uploadFile(fileBuffer, fileName, contentType) {
        try {
            if (!this.client) {
                await this.init();
            }

            await this.createBucketIfNotExists();

            // Convert buffer to Uint8Array
            const fileData = new Uint8Array(fileBuffer);

            // Create object
            const createObjectTx = await this.client.object.createObject({
                bucketName: this.bucketName,
                objectName: fileName,
                creator: process.env.GREENFIELD_ADDRESS,
                visibility: 1, // VISIBILITY_TYPE_PUBLIC_READ
                contentType: contentType,
                redundancyType: 0, // REDUNDANCY_EC_TYPE
                payloadSize: fileData.length,
            });

            // Upload the file data
            const uploadRes = await this.client.object.putObject({
                bucketName: this.bucketName,
                objectName: fileName,
                body: fileData,
                txnHash: createObjectTx.transactionHash,
            });

            const greenfieldUrl = `https://gnfd-testnet-sp1.bnbchain.org/${this.bucketName}/${fileName}`;
            
            console.log('✅ File uploaded to Greenfield:', greenfieldUrl);
            return greenfieldUrl;

        } catch (error) {
            console.error('❌ Greenfield upload error:', error);
            
            // Fallback: return a mock URL for development
            if (process.env.NODE_ENV === 'development') {
                const mockUrl = `https://mock-greenfield.testnet/${this.bucketName}/${fileName}`;
                console.log('⚠️  Using mock URL for development:', mockUrl);
                return mockUrl;
            }
            
            throw new Error(`Greenfield upload failed: ${error.message}`);
        }
    }

    async downloadFile(greenfieldUrl) {
        try {
            if (!this.client) {
                await this.init();
            }

            // Extract bucket and object name from URL
            const urlParts = greenfieldUrl.split('/');
            const bucketName = urlParts[urlParts.length - 2];
            const objectName = urlParts[urlParts.length - 1];

            // Download object
            const res = await this.client.object.getObject({
                bucketName: bucketName,
                objectName: objectName,
            });

            return Buffer.from(res.body);

        } catch (error) {
            console.error('❌ Greenfield download error:', error);
            
            // For development, create a mock file buffer
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️  Using mock file data for development');
                return Buffer.from('mock file content for development');
            }
            
            throw new Error(`Greenfield download failed: ${error.message}`);
        }
    }

    async deleteFile(greenfieldUrl) {
        try {
            if (!this.client) {
                await this.init();
            }

            // Extract bucket and object name from URL
            const urlParts = greenfieldUrl.split('/');
            const bucketName = urlParts[urlParts.length - 2];
            const objectName = urlParts[urlParts.length - 1];

            // Delete object
            const deleteRes = await this.client.object.deleteObject({
                bucketName: bucketName,
                objectName: objectName,
                operator: process.env.GREENFIELD_ADDRESS,
            });

            console.log('✅ File deleted from Greenfield');
            return deleteRes.transactionHash;

        } catch (error) {
            console.error('❌ Greenfield delete error:', error);
            throw new Error(`Greenfield delete failed: ${error.message}`);
        }
    }
}

module.exports = new GreenfieldService();
