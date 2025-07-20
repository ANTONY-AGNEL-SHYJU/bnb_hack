#!/usr/bin/env python3
"""
ScanChain Python Flask Server Startup Script
"""

import sys
import os
import subprocess
import json

def install_requirements():
    """Install required Python packages"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def check_environment():
    """Check if .env file exists and has required variables"""
    env_path = ".env"
    if not os.path.exists(env_path):
        print("⚠️  .env file not found. Creating example...")
        create_env_example()
        return False
    
    print("✅ Environment file found")
    return True

def create_env_example():
    """Create .env.example file"""
    env_example = """# ScanChain Environment Variables
# Copy this to .env and fill in your actual values

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
"""
    
    with open(".env.example", "w") as f:
        f.write(env_example)
    
    print("📝 Created .env.example file. Please copy to .env and configure.")

def create_data_directories():
    """Create data directories if they don't exist"""
    directories = ["data", "uploads", "qr_codes"]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 Created directory: {directory}")
    
    # Create data files if they don't exist
    data_files = {
        "data/users.json": [],
        "data/batches.json": [],
        "data/scans.json": [],
        "data/products.json": []
    }
    
    for file_path, initial_data in data_files.items():
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                json.dump(initial_data, f, indent=2)
            print(f"📄 Created data file: {file_path}")

def main():
    """Main startup function"""
    print("🚀 Starting ScanChain Python Flask Server...")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        return False
    
    print(f"✅ Python version: {sys.version}")
    
    # Create directories
    create_data_directories()
    
    # Check environment
    if not check_environment():
        print("⚠️  Please configure your .env file before running the server")
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete! Starting Flask server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔐 Login page: http://localhost:5000/login")
    print("🏠 Home page: http://localhost:5000/home")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50 + "\n")
    
    # Start the Flask server
    try:
        from server import app
        app.run(
            host='0.0.0.0',
            port=int(os.getenv('PORT', 5000)),
            debug=os.getenv('FLASK_ENV') == 'development'
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
