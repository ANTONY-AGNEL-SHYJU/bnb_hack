#!/usr/bin/env python3
"""Test script to verify role-based dashboard functionality"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.database_service import DatabaseService
import json

# Test the role-based dashboard functionality
db = DatabaseService()

print("=== Testing Role-based Dashboards ===\n")

# Test 1: Manufacturer dashboard (user ID 3 - HARDCORE EAGLE)
print("1. Testing Manufacturer Dashboard (User ID 3 - HARDCORE EAGLE):")
manufacturer_dashboard = db.get_user_dashboard("3")
print(f"   Role: {manufacturer_dashboard.get('role')}")
print(f"   User Name: {manufacturer_dashboard.get('userName')}")
print(f"   Total Batches: {manufacturer_dashboard.get('totalBatches')}")
print(f"   Total Scans: {manufacturer_dashboard.get('totalScans')}")
print(f"   Total Suppliers: {manufacturer_dashboard.get('totalSuppliers')}")
print(f"   Recent Scans: {len(manufacturer_dashboard.get('recentScans', []))}")
print()

# Test 2: Supplier dashboard (user ID 5 - Tanmay)
print("2. Testing Supplier Dashboard (User ID 5 - Tanmay):")
supplier_dashboard = db.get_user_dashboard("5")
print(f"   Role: {supplier_dashboard.get('role')}")
print(f"   User Name: {supplier_dashboard.get('userName')}")
print(f"   Total Scans: {supplier_dashboard.get('totalScans')}")
print(f"   Total Batches Scanned: {supplier_dashboard.get('totalBatches')}")
print(f"   Total Manufacturers: {supplier_dashboard.get('totalManufacturers')}")
print(f"   Scanned Batches: {len(supplier_dashboard.get('scannedBatches', []))}")
print()

# Test 3: General user dashboard (user ID 6 - samyak)
print("3. Testing General User Dashboard (User ID 6 - samyak):")
user_dashboard = db.get_user_dashboard("6")
print(f"   Role: {user_dashboard.get('role')}")
print(f"   User Name: {user_dashboard.get('userName')}")
print(f"   Total Scans: {user_dashboard.get('totalScans')}")
print(f"   Total Batches Viewed: {user_dashboard.get('totalBatches')}")
print(f"   Total Manufacturers: {user_dashboard.get('totalManufacturers')}")
print(f"   Viewed Batches: {len(user_dashboard.get('viewedBatches', []))}")
print()

print("=== Test Complete ===")
