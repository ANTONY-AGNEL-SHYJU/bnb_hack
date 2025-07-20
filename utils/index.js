const crypto = require('crypto-js');
const fs = require('fs');

/**
 * Utility functions for ScanChain
 */

class Utils {
    /**
     * Generate SHA-256 hash for a file buffer
     * @param {Buffer} buffer - File buffer
     * @returns {string} SHA-256 hash
     */
    static generateFileHash(buffer) {
        const wordArray = crypto.lib.WordArray.create(buffer);
        return crypto.SHA256(wordArray).toString();
    }

    /**
     * Generate SHA-256 hash for a file path
     * @param {string} filePath - Path to file
     * @returns {string} SHA-256 hash
     */
    static generateFileHashFromPath(filePath) {
        const buffer = fs.readFileSync(filePath);
        return this.generateFileHash(buffer);
    }

    /**
     * Validate Ethereum address format
     * @param {string} address - Ethereum address
     * @returns {boolean} True if valid
     */
    static isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Generate random product ID
     * @param {number} length - Length of ID
     * @returns {string} Random product ID
     */
    static generateProductId(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Format timestamp to human-readable date
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted date
     */
    static formatTimestamp(timestamp) {
        return new Date(timestamp * 1000).toISOString();
    }

    /**
     * Validate file type
     * @param {string} filename - File name
     * @param {string[]} allowedTypes - Allowed file extensions
     * @returns {boolean} True if valid
     */
    static validateFileType(filename, allowedTypes = ['.pdf', '.json']) {
        const extension = '.' + filename.split('.').pop().toLowerCase();
        return allowedTypes.includes(extension);
    }

    /**
     * Convert bytes to human-readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Human-readable size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after sleep
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} retries - Number of retries
     * @param {number} delay - Initial delay in ms
     * @returns {Promise} Result of function
     */
    static async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await this.sleep(delay);
                return this.retry(fn, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    /**
     * Sanitize filename for storage
     * @param {string} filename - Original filename
     * @returns {string} Sanitized filename
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    /**
     * Generate unique filename with timestamp
     * @param {string} originalName - Original filename
     * @param {string} productId - Product ID
     * @returns {string} Unique filename
     */
    static generateUniqueFilename(originalName, productId) {
        const extension = originalName.split('.').pop();
        const timestamp = Date.now();
        const sanitizedProductId = this.sanitizeFilename(productId);
        return `${sanitizedProductId}-${timestamp}.${extension}`;
    }
}

module.exports = Utils;
