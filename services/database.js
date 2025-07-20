// Enhanced JSON-based database for ScanChain supply chain management
// Persistent storage using JSON files for development/demo purposes
const fs = require('fs');
const path = require('path');

class SupplyChainDB {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.batchesFile = path.join(this.dataDir, 'batches.json');
        this.scansFile = path.join(this.dataDir, 'scans.json');
        this.productsFile = path.join(this.dataDir, 'products.json');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        // Initialize JSON files if they don't exist
        this.initializeFiles();
        
        // Load data from JSON files
        this.loadData();
    }

    initializeFiles() {
        const files = [
            { path: this.batchesFile, data: { batches: [], lastBatchId: 0 } },
            { path: this.scansFile, data: { scans: [], lastScanId: 0 } },
            { path: this.productsFile, data: { products: [], metadata: [], lastProductId: 0 } }
        ];

        files.forEach(file => {
            if (!fs.existsSync(file.path)) {
                fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2));
            }
        });
    }

    loadData() {
        try {
            this.batchesData = JSON.parse(fs.readFileSync(this.batchesFile, 'utf8'));
            this.scansData = JSON.parse(fs.readFileSync(this.scansFile, 'utf8'));
            this.productsData = JSON.parse(fs.readFileSync(this.productsFile, 'utf8'));
        } catch (error) {
            console.error('Error loading data from JSON files:', error);
            // Reinitialize if files are corrupted
            this.batchesData = { batches: [], lastBatchId: 0 };
            this.scansData = { scans: [], lastScanId: 0 };
            this.productsData = { products: [], metadata: [], lastProductId: 0 };
            this.saveAllData();
        }
    }

    saveAllData() {
        try {
            fs.writeFileSync(this.batchesFile, JSON.stringify(this.batchesData, null, 2));
            fs.writeFileSync(this.scansFile, JSON.stringify(this.scansData, null, 2));
            fs.writeFileSync(this.productsFile, JSON.stringify(this.productsData, null, 2));
        } catch (error) {
            console.error('Error saving data to JSON files:', error);
        }
    }

    saveBatches() {
        try {
            fs.writeFileSync(this.batchesFile, JSON.stringify(this.batchesData, null, 2));
        } catch (error) {
            console.error('Error saving batches:', error);
        }
    }

    saveScans() {
        try {
            fs.writeFileSync(this.scansFile, JSON.stringify(this.scansData, null, 2));
        } catch (error) {
            console.error('Error saving scans:', error);
        }
    }

    saveProducts() {
        try {
            fs.writeFileSync(this.productsFile, JSON.stringify(this.productsData, null, 2));
        } catch (error) {
            console.error('Error saving products:', error);
        }
    }

    // Initialize with sample data for demonstration
    initializeSampleData() {
        // Sample manufacturers
        this.manufacturers.set('MFG001', {
            id: 'MFG001',
            name: 'TechCorp Industries',
            email: 'contact@techcorp.com',
            verified: true,
            createdAt: new Date().toISOString(),
            totalBatches: 0
        });

        this.manufacturers.set('MFG002', {
            id: 'MFG002',
            name: 'BioPharm Solutions',
            email: 'info@biopharm.com',
            verified: true,
            createdAt: new Date().toISOString(),
            totalBatches: 0
        });

        // Sample batch for testing
        const sampleBatchId = 'TECH' + Date.now().toString(36);
        this.storeBatch(sampleBatchId, {
            manufacturerId: 'MFG001',
            productName: 'Premium Electronics Kit',
            productCategory: 'electronics',
            productDescription: 'High-quality electronics components with authenticity verification',
            fileHash: 'sample_hash_' + Date.now(),
            publicUrl: 'https://example.com/certificate.pdf',
            contractAddress: '0x03D1DC1fC2DB1E831D511B74f5a0Cb34585770d8',
            txHash: '0x' + Date.now().toString(16)
        });
    }

    // Store batch information with enhanced tracking and JSON persistence
    storeBatch(batchId, data) {
        const batch = {
            ...data,
            batchId,
            createdAt: new Date().toISOString(),
            scans: [],
            status: 'active',
            lastActivity: new Date().toISOString(),
            metadata: {
                fileName: data.fileName || 'unknown',
                fileSize: data.fileSize || 0,
                mimeType: data.mimeType || 'application/octet-stream',
                uploadedBy: data.userId || 'unknown',
                uploadedAt: new Date().toISOString()
            }
        };
        
        // Add to batches array
        this.batchesData.batches.push(batch);
        this.batchesData.lastBatchId++;
        
        // Save to JSON file
        this.saveBatches();
        
        // Also store in products data for metadata tracking
        const productMetadata = {
            productId: batchId,
            userId: data.userId,
            userEmail: data.userEmail,
            batchName: data.batchName,
            manufacturerName: data.manufacturerName,
            productType: data.productType,
            description: data.description,
            fileHash: data.fileHash,
            greenfieldUrl: data.greenfieldUrl,
            txHash: data.txHash,
            contractAddress: data.contractAddress,
            createdAt: new Date().toISOString(),
            metadata: batch.metadata
        };
        
        this.productsData.products.push(productMetadata);
        this.productsData.lastProductId++;
        this.saveProducts();
        
        return batch;
    }

    // Get batch information from JSON data
    getBatch(batchId) {
        return this.batchesData.batches.find(batch => batch.batchId === batchId);
    }

    // Record a scan event with enhanced supplier tracking and JSON persistence
    recordScan(batchId, scanData) {
        const batch = this.getBatch(batchId);
        if (batch) {
            const scanRecord = {
                id: (this.scansData.lastScanId + 1).toString(),
                batchId,
                ...scanData,
                timestamp: new Date().toISOString(),
                location: scanData.location || 'Unknown'
            };
            
            // Add scan to the specific batch
            batch.scans.push(scanRecord);
            batch.lastActivity = new Date().toISOString();
            
            // Update the batch in the array
            const batchIndex = this.batchesData.batches.findIndex(b => b.batchId === batchId);
            if (batchIndex !== -1) {
                this.batchesData.batches[batchIndex] = batch;
                this.saveBatches();
            }
            
            // Add to scans data
            this.scansData.scans.push(scanRecord);
            this.scansData.lastScanId++;
            this.saveScans();
            
            return scanRecord;
        }
        return null;
    }

    // Track supplier information
    trackSupplier(supplierName, batchId, scanId) {
        const supplierId = this.generateSupplierId(supplierName);
        
        if (!this.suppliers.has(supplierId)) {
            this.suppliers.set(supplierId, {
                id: supplierId,
                name: supplierName,
                firstScanAt: new Date().toISOString(),
                totalScans: 0,
                batchesScanned: [],
                lastActivity: new Date().toISOString()
            });
            this.analytics.totalSuppliers++;
        }
        
        const supplier = this.suppliers.get(supplierId);
        supplier.totalScans++;
        supplier.lastActivity = new Date().toISOString();
        
        if (!supplier.batchesScanned.includes(batchId)) {
            supplier.batchesScanned.push(batchId);
        }
    }

    // Generate supplier ID from name
    generateSupplierId(supplierName) {
        return 'SUP_' + supplierName.replace(/\s+/g, '_').toUpperCase();
    }

    // Get all scans for a batch
    getBatchScans(batchId) {
        const batch = this.batches.get(batchId);
        return batch ? batch.scans : [];
    }

    // Get manufacturer dashboard data from JSON storage
    getManufacturerDashboard(manufacturerId) {
        const manufacturerBatches = [];
        const recentScans = [];
        let totalScans = 0;
        let uniqueSuppliers = new Set();
        
        // Filter batches by manufacturer from JSON data
        this.batchesData.batches.forEach(batch => {
            if (batch.manufacturerId === manufacturerId || 
                batch.manufacturerName === manufacturerId ||
                batch.userId === manufacturerId) {
                manufacturerBatches.push(batch);
                
                // Collect recent scans
                batch.scans.forEach(scan => {
                    recentScans.push({
                        ...scan,
                        batchId: batch.batchId,
                        productName: batch.batchName || batch.productName
                    });
                    totalScans++;
                    if (scan.supplierName) {
                        uniqueSuppliers.add(scan.supplierName);
                    }
                });
            }
        });
        
        // Sort recent scans by timestamp (newest first)
        recentScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return {
            manufacturerId,
            totalBatches: manufacturerBatches.length,
            totalScans,
            totalSuppliers: uniqueSuppliers.size,
            batches: manufacturerBatches,
            recentScans: recentScans.slice(0, 10), // Last 10 scans
            supplierList: Array.from(uniqueSuppliers)
        };
    }

    // Get all products/batches for a specific user
    getUserProducts(userId) {
        return this.productsData.products.filter(product => product.userId === userId);
    }

    // Get user metadata including their uploads and activity
    getUserMetadata(userId) {
        const userProducts = this.getUserProducts(userId);
        const userScans = this.scansData.scans.filter(scan => 
            userProducts.some(product => product.productId === scan.batchId)
        );

        return {
            userId,
            totalUploads: userProducts.length,
            totalScans: userScans.length,
            products: userProducts,
            recentActivity: userScans.slice(-10), // Last 10 scans
            uploadHistory: userProducts.map(product => ({
                productId: product.productId,
                batchName: product.batchName,
                uploadedAt: product.createdAt,
                fileHash: product.fileHash,
                txHash: product.txHash
            }))
        };
    }

    // Search products by various criteria
    searchProducts(query, criteria = 'all') {
        const searchTerm = query.toLowerCase();
        return this.productsData.products.filter(product => {
            switch(criteria) {
                case 'productId':
                    return product.productId.toLowerCase().includes(searchTerm);
                case 'batchName':
                    return product.batchName && product.batchName.toLowerCase().includes(searchTerm);
                case 'manufacturer':
                    return product.manufacturerName && product.manufacturerName.toLowerCase().includes(searchTerm);
                case 'productType':
                    return product.productType && product.productType.toLowerCase().includes(searchTerm);
                default:
                    return product.productId.toLowerCase().includes(searchTerm) ||
                           (product.batchName && product.batchName.toLowerCase().includes(searchTerm)) ||
                           (product.manufacturerName && product.manufacturerName.toLowerCase().includes(searchTerm)) ||
                           (product.productType && product.productType.toLowerCase().includes(searchTerm));
            }
        });
    }

    // Update daily activity analytics
    updateDailyActivity(action) {
        const today = new Date().toISOString().split('T')[0];
        
        if (!this.analytics.dailyActivity.has(today)) {
            this.analytics.dailyActivity.set(today, {
                date: today,
                batches_created: 0,
                scans_recorded: 0,
                total_activity: 0
            });
        }
        
        const dayActivity = this.analytics.dailyActivity.get(today);
        if (action === 'batch_created') {
            dayActivity.batches_created++;
        } else if (action === 'scan_recorded') {
            dayActivity.scans_recorded++;
        }
        dayActivity.total_activity++;
    }

    // Get system analytics
    getSystemAnalytics() {
        const last7Days = Array.from(this.analytics.dailyActivity.values())
            .slice(-7)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        return {
            ...this.analytics,
            last7Days,
            activeManufacturers: this.manufacturers.size,
            totalManufacturers: this.manufacturers.size
        };
    }

    // Get all manufacturers
    getManufacturers() {
        return Array.from(this.manufacturers.values());
    }

    // Get all suppliers
    getSuppliers() {
        return Array.from(this.suppliers.values());
    }

    // Search batches by various criteria
    searchBatches(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const [batchId, batch] of this.batches) {
            if (
                batchId.toLowerCase().includes(searchTerm) ||
                batch.productName.toLowerCase().includes(searchTerm) ||
                batch.productCategory.toLowerCase().includes(searchTerm) ||
                batch.manufacturerId.toLowerCase().includes(searchTerm)
            ) {
                results.push({
                    batchId,
                    ...batch
                });
            }
        }
        
        return results;
    }

    // Get batch statistics
    getBatchStats(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) return null;
        
        const uniqueSuppliers = new Set();
        batch.scans.forEach(scan => {
            if (scan.supplierName) {
                uniqueSuppliers.add(scan.supplierName);
            }
        });
        
        return {
            ...batch,
            stats: {
                totalScans: batch.scans.length,
                uniqueSuppliers: uniqueSuppliers.size,
                lastScanAt: batch.scans.length > 0 ? 
                    batch.scans[batch.scans.length - 1].timestamp : null,
                avgScansPerDay: this.calculateAvgScansPerDay(batch)
            }
        };
    }

    // Calculate average scans per day for a batch
    calculateAvgScansPerDay(batch) {
        if (batch.scans.length === 0) return 0;
        
        const createdDate = new Date(batch.createdAt);
        const now = new Date();
        const daysDiff = Math.max(1, Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24)));
        
        return Math.round((batch.scans.length / daysDiff) * 100) / 100;
    }
}

// Global instance
const supplyChainDB = new SupplyChainDB();

module.exports = supplyChainDB;
