# ScanChain Python Backend

A Flask-based backend for the ScanChain product authenticity verification system, integrating BNB Greenfield for decentralized storage and BNB Smart Chain for blockchain verification.

## 🚀 Quick Start

### Windows Users
1. **Double-click** `start_server.bat` OR
2. **Right-click** `start_server.ps1` → "Run with PowerShell"

### Manual Start
```bash
python run_server.py
```

## 📋 Prerequisites

- **Python 3.7+** (Download from [python.org](https://www.python.org/))
- **Git** (for cloning the repository)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd BNB_Hackethon
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup environment:**
   - Copy `.env.example` to `.env`
   - Configure your BNB Smart Chain and Greenfield credentials

4. **Start the server:**
   ```bash
   python run_server.py
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/demo-login` - Demo login

### Product Management
- `POST /api/upload` - Upload product files and generate QR codes
- `POST /api/verify` - Verify product authenticity
- `GET /api/product/:id` - Get product information
- `POST /api/scan` - Record product scan
- `GET /api/dashboard/:manufacturerId` - Manufacturer dashboard
- `GET /api/products/search` - Search products

### User Management
- `GET /api/user/metadata` - Get current user metadata
- `GET /api/user/:id/metadata` - Get specific user metadata

## 🏠 Frontend Routes

- `/` or `/login` - Login page
- `/register` - Registration page
- `/home` - Main dashboard
- `/upload` - File upload page
- `/scan` - QR code scanning
- `/verify` - Product verification
- `/dashboard` - Manufacturer dashboard

## 📁 Project Structure

```
├── server.py                 # Main Flask application
├── run_server.py            # Server startup script
├── requirements.txt         # Python dependencies
├── services/               # Core service modules
│   ├── auth_service.py     # Authentication service
│   ├── database_service.py # JSON database operations
│   ├── blockchain_service.py # BSC integration
│   ├── greenfield_service.py # BNB Greenfield integration
│   └── qr_service.py       # QR code generation
├── routes/                 # API route handlers
│   └── auth_routes.py      # Authentication routes
├── data/                   # JSON data storage
│   ├── users.json          # User accounts
│   ├── batches.json        # Product batches
│   ├── scans.json          # Scan records
│   └── products.json       # Product metadata
├── uploads/                # Uploaded files
├── qr_codes/               # Generated QR codes
└── public/                 # Frontend HTML files
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# BNB Smart Chain Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
PRIVATE_KEY=your-private-key-here
CONTRACT_ADDRESS=your-contract-address-here

# BNB Greenfield Configuration
GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_ACCOUNT_ADDRESS=your-greenfield-address-here
GREENFIELD_ACCOUNT_PRIVATE_KEY=your-greenfield-private-key-here
GREENFIELD_BUCKET_NAME=scanchain-bucket

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,gif,doc,docx,txt

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRES=86400
```

## 🔐 Authentication System

- **JWT-based authentication** with 24-hour token expiration
- **bcrypt password hashing** for secure password storage
- **JSON file-based user storage** for simplicity
- **Role-based access control** (user/admin roles)

## 💾 Data Storage

- **JSON files** for user accounts and product metadata
- **Local file system** for uploaded documents
- **BNB Greenfield** for decentralized file storage
- **BNB Smart Chain** for hash verification and immutable records

## 🔍 Key Features

1. **Secure File Upload** - Validates file types and sizes
2. **QR Code Generation** - Creates unique QR codes for products
3. **Blockchain Integration** - Stores file hashes on BSC
4. **Decentralized Storage** - Uses BNB Greenfield for files
5. **Product Verification** - Compares current vs stored hashes
6. **Supply Chain Tracking** - Records scans throughout supply chain
7. **Manufacturer Dashboard** - Analytics and batch management

## 🧪 Testing

The server includes several test endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/demo-login` - Demo authentication

## 🚀 Production Deployment

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 server:app
   ```

## 📞 Support

For issues or questions, please check the project documentation or create an issue in the repository.

## 🏗️ Migration from Node.js

This Python Flask backend maintains API compatibility with the original Node.js version:
- Same endpoint structure and responses
- Identical JSON data format
- Compatible with existing frontend
- Same authentication flow

All functionality from the Node.js version has been preserved and enhanced.
