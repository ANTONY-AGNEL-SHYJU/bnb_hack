/**
 * Global error handler middleware
 */

const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);

    // Multer errors
    if (err instanceof Error && err.code) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'File size too large. Maximum size is 10MB.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Too many files. Only one file is allowed.'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Unexpected file field. Use "file" as the field name.'
                });
            default:
                break;
        }
    }

    // File type errors
    if (err.message && err.message.includes('Only PDF and JSON files are allowed')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type. Only PDF and JSON files are allowed.'
        });
    }

    // Blockchain errors
    if (err.message && err.message.includes('blockchain')) {
        return res.status(503).json({
            success: false,
            error: 'Blockchain service temporarily unavailable. Please try again later.'
        });
    }

    // Greenfield errors
    if (err.message && err.message.includes('Greenfield')) {
        return res.status(503).json({
            success: false,
            error: 'Storage service temporarily unavailable. Please try again later.'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    // Network/timeout errors
    if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable. Please check your network connection and try again.'
        });
    }

    // Rate limiting errors
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please try again later.'
        });
    }

    // Default error response
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
