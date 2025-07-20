/**
 * Validation middleware for API endpoints
 */

const validateUpload = (req, res, next) => {
    const { productId } = req.body;
    const file = req.file;

    // Validate productId
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'productId is required and must be a non-empty string'
        });
    }

    // Validate productId format (alphanumeric with hyphens and underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
        return res.status(400).json({
            success: false,
            error: 'productId can only contain letters, numbers, hyphens, and underscores'
        });
    }

    // Validate file
    if (!file) {
        return res.status(400).json({
            success: false,
            error: 'File is required'
        });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            error: 'File size cannot exceed 10MB'
        });
    }

    // Validate file type
    const allowedMimeTypes = [
        'application/pdf',
        'application/json',
        'text/json'
    ];
    
    const allowedExtensions = ['.pdf', '.json'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
            success: false,
            error: 'Only PDF and JSON files are allowed'
        });
    }

    next();
};

const validateVerify = (req, res, next) => {
    const { productId, greenfieldUrl } = req.body;

    // Validate productId
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'productId is required and must be a non-empty string'
        });
    }

    // Validate productId format
    if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid productId format'
        });
    }

    // Validate greenfieldUrl
    if (!greenfieldUrl || typeof greenfieldUrl !== 'string' || greenfieldUrl.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'greenfieldUrl is required and must be a non-empty string'
        });
    }

    // Basic URL validation
    try {
        new URL(greenfieldUrl);
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'greenfieldUrl must be a valid URL'
        });
    }

    // Validate that it's a Greenfield URL (basic check)
    if (!greenfieldUrl.includes('gnfd') && !greenfieldUrl.includes('greenfield') && !greenfieldUrl.includes('bnbchain')) {
        return res.status(400).json({
            success: false,
            error: 'greenfieldUrl must be a valid Greenfield storage URL'
        });
    }

    next();
};

const validateQRScan = (req, res, next) => {
    const { qrData } = req.body;

    if (!qrData || typeof qrData !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'qrData is required and must be a string'
        });
    }

    try {
        const parsed = JSON.parse(qrData);
        
        // Validate required QR fields
        if (!parsed.productId || !parsed.contractAddress) {
            return res.status(400).json({
                success: false,
                error: 'QR code missing required fields: productId and contractAddress'
            });
        }

        // Validate contract address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(parsed.contractAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contract address format in QR code'
            });
        }

        req.qrData = parsed;
        next();

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid QR code format: must be valid JSON'
        });
    }
};

module.exports = {
    validateUpload,
    validateVerify,
    validateQRScan
};
