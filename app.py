from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import os
import hashlib
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='public', static_url_path='')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-for-testing')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size

CORS(app)
jwt = JWTManager(app)

# Import services
from services.auth_service import AuthService
from services.database_service import DatabaseService
from services.greenfield_service import GreenfieldService
from services.blockchain_service import BlockchainService
from services.qr_service import QRService

# Import routes
from routes.auth_routes import auth_bp

# Initialize services
auth_service = AuthService()
db_service = DatabaseService()
greenfield_service = GreenfieldService()
blockchain_service = BlockchainService()
qr_service = QRService()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')

@app.errorhandler(413)
def too_large(e):
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 10MB.'}), 413

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 10MB.'}), 413

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'contract': os.getenv('CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000')
    })

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    try:
        current_user_id = get_jwt_identity()
        user = auth_service.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        product_id = request.form.get('productId')
        manufacturer_name = request.form.get('manufacturerName')
        batch_name = request.form.get('batchName')
        product_type = request.form.get('productType')
        description = request.form.get('description')
        
        if not product_id:
            return jsonify({'success': False, 'error': 'Product ID is required'}), 400
        
        file_data = file.read()
        file_hash = hashlib.sha256(file_data).hexdigest()
        
        greenfield_url = greenfield_service.upload_file(
            file_data,
            f"{product_id}-{int(datetime.utcnow().timestamp())}.{file.filename.split('.')[-1]}",
            file.content_type
        )
        
        tx_hash = blockchain_service.store_product_hash(product_id, file_hash)
        
        batch_data = {
            'manufacturerId': manufacturer_name.lower().replace(' ', '_') if manufacturer_name else 'unknown',
            'manufacturerName': manufacturer_name or 'Unknown Manufacturer',
            'batchName': batch_name or product_id,
            'productType': product_type or 'Unknown',
            'description': description or '',
            'fileHash': file_hash,
            'greenfieldUrl': greenfield_url,
            'txHash': tx_hash,
            'contractAddress': os.getenv('BSC_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'documentUrl': greenfield_url,
            'userId': user['id'],
            'userEmail': user['email'],
            'fileName': file.filename,
            'fileSize': len(file_data),
            'mimeType': file.content_type,
            'uploadTimestamp': datetime.utcnow().isoformat()
        }
        
        db_service.store_batch(product_id, batch_data)
        
        auth_service.associate_blockchain_hash(user['id'], {
            'batchId': product_id,
            'fileHash': file_hash,
            'txHash': tx_hash,
            'contractAddress': os.getenv('BSC_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'blockNumber': None,
            'productName': batch_data['batchName']
        })
        
        qr_result = qr_service.generate_product_qr(
            product_id, 
            os.getenv('BSC_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
            {
                'batchName': batch_data['batchName'],
                'manufacturer': batch_data['manufacturerName'],
                'productType': batch_data['productType']
            }
        )
        
        return jsonify({
            'success': True,
            'batchId': product_id,
            'manufacturerName': batch_data['manufacturerName'],
            'batchName': batch_data['batchName'],
            'fileHash': file_hash,
            'greenfieldUrl': greenfield_url,
            'txHash': tx_hash,
            'qrCode': qr_result['qrImage'],
            'qrCodeData': qr_result['qrData'],
            'contractAddress': os.getenv('BSC_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'message': 'Batch created successfully! Share the QR code with your supply chain partners.'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/verify', methods=['POST'])
@jwt_required()
def verify_product():
    try:
        data = request.get_json()
        product_id = data.get('productId')
        greenfield_url = data.get('greenfieldUrl')
        
        if not product_id:
            return jsonify({'success': False, 'error': 'Product ID is required'}), 400
        
        stored_hash = blockchain_service.get_product_hash(product_id)
        
        if not stored_hash:
            return jsonify({
                'success': True,
                'isVerified': False,
                'error': 'Product not found on blockchain',
                'productId': product_id
            })
        
        if greenfield_url:
            file_data = greenfield_service.download_file(greenfield_url)
            current_hash = hashlib.sha256(file_data).hexdigest()
        else:
            current_hash = stored_hash
        
        is_verified = stored_hash == current_hash
        
        return jsonify({
            'success': True,
            'isVerified': is_verified,
            'productId': product_id,
            'storedHash': stored_hash,
            'currentHash': current_hash,
            'message': 'Product is authentic' if is_verified else 'Product has been tampered with'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scan', methods=['POST'])
@jwt_required()
def scan_product():
    try:
        data = request.get_json()
        qr_data = data.get('qrData')
        supplier_name = data.get('supplierName')
        supplier_location = data.get('supplierLocation')
        
        if not qr_data or not supplier_name:
            return jsonify({'success': False, 'error': 'QR data and supplier name are required'}), 400
        
        try:
            import json
            parsed_qr = json.loads(qr_data) if isinstance(qr_data, str) else qr_data
        except json.JSONDecodeError:
            return jsonify({'success': False, 'error': 'Invalid QR code format'}), 400
        
        batch_id = parsed_qr.get('productId')
        batch = db_service.get_batch(batch_id)
        
        if not batch:
            return jsonify({'success': False, 'error': 'Batch not found'}), 404
        
        current_user_identity = get_jwt_identity()
        
        scan_record = db_service.record_scan(batch_id, {
            'supplierName': supplier_name,
            'supplierLocation': supplier_location or 'Unknown',
            'scanType': 'QR_SCAN',
            'ipAddress': request.remote_addr,
            'userAgent': request.headers.get('User-Agent'),
            'userId': current_user_identity.get('id') if isinstance(current_user_identity, dict) else None,
            'scannerUsername': current_user_identity.get('username') if isinstance(current_user_identity, dict) else current_user_identity
        })
        
        return jsonify({
            'success': True,
            'batchInfo': {
                'batchId': batch_id,
                'batchName': batch.get('batchName'),
                'manufacturerName': batch.get('manufacturerName'),
                'productType': batch.get('productType'),
                'description': batch.get('description'),
                'documentUrl': batch.get('documentUrl'),
                'createdAt': batch.get('createdAt'),
                'contractAddress': batch.get('contractAddress'),
                'txHash': batch.get('txHash')
            },
            'scanRecord': {
                'scanId': scan_record['id'],
                'timestamp': scan_record['timestamp'],
                'supplierName': scan_record['supplierName']
            },
            'message': f'Welcome {supplier_name}! Scan recorded successfully.'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/dashboard/<user_id>', methods=['GET'])
@jwt_required()
def get_dashboard(user_id):
    try:
        dashboard_data = db_service.get_user_dashboard(user_id)
        return jsonify({'success': True, **dashboard_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/product/<product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    try:
        if not product_id:
            return jsonify({'success': False, 'error': 'Product ID is required'}), 400
        
        product_info = blockchain_service.get_product_info(product_id)
        
        if not product_info.get('fileHash'):
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        return jsonify({'success': True, 'productId': product_id, **product_info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Frontend routes
@app.route('/')
def serve_login():
    return send_from_directory('public', 'login.html')

@app.route('/home')
def serve_home():
    return send_from_directory('public', 'index.html')

@app.route('/login')
def serve_login_page():
    return send_from_directory('public', 'login.html')

@app.route('/register')
def serve_register():
    return send_from_directory('public', 'register.html')

@app.route('/upload')
def serve_upload():
    return send_from_directory('public', 'upload.html')

@app.route('/scan')
def serve_scan():
    return send_from_directory('public', 'scan.html')

@app.route('/verify')
def serve_verify():
    return send_from_directory('public', 'verify.html')

@app.route('/dashboard')
def serve_dashboard():
    return send_from_directory('public', 'dashboard.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('public', filename)

if __name__ == '__main__':
    print("🚀 ScanChain Flask server starting...")
    print(f"📊 Health check available at http://localhost:5000/api/health")
    print(f"📋 Environment: {os.getenv('FLASK_ENV', 'development')}")
    app.run(debug=True, host='0.0.0.0', port=5000)