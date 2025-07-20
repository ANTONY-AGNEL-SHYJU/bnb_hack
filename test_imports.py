#!/usr/bin/env python
# Test script to verify Greenfield service
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

try:
    print("Testing Greenfield service import...")
    from services.greenfield_service import GreenfieldService
    print("✅ GreenfieldService imported successfully")
    
    print("Testing service initialization...")
    service = GreenfieldService()
    print(f"✅ Service initialized in {service.mode} mode")
    print(f"   Bucket: {service.bucket_name}")
    print(f"   Account configured: {bool(service.account_address)}")
    
    print("Testing server import...")
    import server
    print("✅ Server module imported successfully")
    
    print("\n🎉 All tests passed! Ready to start server.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
