# ScanChain Project Instructions

This is a BNB Chain project that combines BNB Greenfield for decentralized storage and BNB Smart Chain for blockchain verification.

## Key Technologies
- Node.js with Express.js for the backend
- BNB Greenfield SDK for file storage
- Ethers.js for blockchain interactions
- QR code generation for product verification
- SHA-256 hashing for file integrity

## Project Structure
- `/services/` - Core service integrations (Greenfield, Blockchain, QR)
- `/middleware/` - Express middleware for validation and error handling
- `/contracts/` - Solidity smart contracts
- `/routes/` - API route handlers
- `/scripts/` - Utility and deployment scripts

## Development Guidelines
- Use the environment variables defined in `.env.example`
- All file uploads should be validated for type and size
- Blockchain interactions should include proper error handling
- QR codes should contain product ID and contract address
- Hash verification compares stored vs current file hashes

## API Endpoints
- POST `/api/upload` - Upload files and generate QR codes
- POST `/api/verify` - Verify product authenticity
- GET `/api/product/:id` - Get product information
- POST `/api/qr/*` - QR code operations

When working on this project, prioritize:
1. Secure file handling and validation
2. Robust blockchain error handling
3. Clear API documentation
4. Comprehensive testing
