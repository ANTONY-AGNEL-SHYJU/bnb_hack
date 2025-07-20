#!/usr/bin/env python3
"""
ScanChain Authentication Test Script
"""

import requests
import json

def test_auth_system():
    """Test the authentication system"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing ScanChain Authentication System")
    print("=" * 50)
    
    # Test registration
    print("\n📝 Testing User Registration...")
    register_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "fullName": "Test User",
        "role": "user",
        "companyName": "Test Company"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=register_data)
        print(f"Registration Status: {response.status_code}")
        print(f"Registration Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Registration successful!")
            registration_token = response.json().get('token')
        else:
            print("❌ Registration failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    # Test login
    print("\n🔐 Testing User Login...")
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            login_token = response.json().get('token')
        else:
            print("❌ Login failed!")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Test token verification
    print("\n🔍 Testing Token Verification...")
    headers = {"Authorization": f"Bearer {login_token}"}
    
    try:
        response = requests.get(f"{base_url}/api/auth/verify", headers=headers)
        print(f"Verification Status: {response.status_code}")
        print(f"Verification Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Token verification successful!")
        else:
            print("❌ Token verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False
    
    # Test demo login
    print("\n🎭 Testing Demo Login...")
    demo_data = {"userType": "manufacturer"}
    
    try:
        response = requests.post(f"{base_url}/api/auth/demo-login", json=demo_data)
        print(f"Demo Login Status: {response.status_code}")
        print(f"Demo Login Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Demo login successful!")
        else:
            print("❌ Demo login failed!")
            
    except Exception as e:
        print(f"❌ Demo login error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication system tests completed!")
    return True

if __name__ == "__main__":
    test_auth_system()
