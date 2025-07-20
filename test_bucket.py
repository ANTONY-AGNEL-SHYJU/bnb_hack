#!/usr/bin/env python3
"""Test script to verify the bucket name configuration"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== Environment Test ===")
print(f"GREENFIELD_BUCKET_NAME: {os.getenv('GREENFIELD_BUCKET_NAME', 'NOT_SET')}")

# Test the service import
try:
    from services.greenfield_service import GreenfieldService
    service = GreenfieldService()
    print(f"Service bucket_name: {service.bucket_name}")
    print(f"Service mode: {service.mode}")
except Exception as e:
    print(f"Error importing service: {e}")
