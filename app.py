"""
Rice Leaf Disease Classification - Flask Backend
Production-Quality AI Application
Powered by YOLOv8 Classification
"""

import os
import json
import base64
from datetime import datetime
from pathlib import Path
from io import BytesIO

from flask import Flask, render_template, request, jsonify
from PIL import Image
import numpy as np
from ultralytics import YOLO

# Initialize Flask Application
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create upload directory if it doesn't exist
UPLOAD_FOLDER = Path('static/uploads')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global model variable
model = None
model_loaded = False


def load_model():
    """Load YOLOv8 Classification model"""
    global model, model_loaded
    try:
        model_path = Path('best.pt')
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        model = YOLO(str(model_path))
        model_loaded = True
        print("[INFO] YOLOv8 Model loaded successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load model: {str(e)}")
        model_loaded = False
        return False


def classify_image(image_path):
    """
    Classify rice leaf image using YOLOv8
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary with prediction results and probabilities
    """
    if not model_loaded or model is None:
        return {
            'success': False,
            'error': 'AI model could not be loaded. Please ensure best.pt exists inside the model directory.'
        }
    
    try:
        # Run inference
        results = model(str(image_path))
        
        if not results or len(results) == 0:
            return {'success': False, 'error': 'Failed to classify the image.'}
        
        # Extract prediction results
        result = results[0]
        probs = result.probs
        
        # Get top prediction
        class_id = int(probs.top1)
        confidence = float(probs.top1conf) * 100  # Convert to percentage
        class_name = result.names[class_id]
        
        # Get all class probabilities
        all_probs = (probs.data.cpu().numpy() * 100).tolist()
        class_names = list(result.names.values())
        
        # Build probabilities dictionary
        probabilities = {name: prob for name, prob in zip(class_names, all_probs)}
        
        # Generate timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        return {
            'success': True,
            'disease': class_name,
            'confidence': round(confidence, 2),
            'probabilities': probabilities,
            'image': str(image_path).replace('\\', '/'),
            'timestamp': timestamp
        }
    
    except Exception as e:
        print(f"[ERROR] Classification error: {str(e)}")
        return {'success': False, 'error': 'Failed to classify the image.'}


def save_uploaded_file(file):
    """
    Save uploaded file to uploads folder
    
    Args:
        file: Flask FileStorage object
        
    Returns:
        Tuple of (success, file_path, error_message)
    """
    try:
        if file.filename == '':
            return False, None, 'No file selected.'
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return False, None, 'Invalid file format. Please upload PNG, JPG, JPEG, GIF, or WebP.'
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'upload_{timestamp}.{file_ext}'
        filepath = UPLOAD_FOLDER / filename
        
        # Save file
        file.save(str(filepath))
        
        # Validate image
        try:
            img = Image.open(filepath)
            img.verify()  # Verify it's a valid image
        except Exception as e:
            filepath.unlink()  # Delete invalid file
            return False, None, f'Invalid image file: {str(e)}'
        
        return True, f'static/uploads/{filename}', None
    
    except Exception as e:
        print(f"[ERROR] File save error: {str(e)}")
        return False, None, f'Failed to save file: {str(e)}'


def save_base64_image(image_data):
    """
    Save base64 encoded image from camera capture
    
    Args:
        image_data: Base64 encoded image string
        
    Returns:
        Tuple of (success, file_path, error_message)
    """
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'camera_{timestamp}.png'
        filepath = UPLOAD_FOLDER / filename
        
        # Save image
        image.save(str(filepath), 'PNG')
        
        return True, f'static/uploads/{filename}', None
    
    except Exception as e:
        print(f"[ERROR] Base64 image save error: {str(e)}")
        return False, None, f'Failed to save camera image: {str(e)}'


# ============================================================================
# ROUTES
# ============================================================================

@app.route('/')
def index():
    """Render homepage"""
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """
    Classify uploaded or captured image
    
    Expected form data:
        - 'file': Uploaded image file (multipart/form-data), OR
        - 'image': Base64 encoded image string (application/json)
    """
    try:
        file_path = None
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            success, file_path, error = save_uploaded_file(file)
            if not success:
                return jsonify({'success': False, 'error': error}), 400
        
        # Handle base64 camera capture
        elif request.is_json:
            data = request.get_json()
            if 'image' in data:
                success, file_path, error = save_base64_image(data['image'])
                if not success:
                    return jsonify({'success': False, 'error': error}), 400
        
        # No image provided
        if not file_path:
            return jsonify({'success': False, 'error': 'Please upload or capture an image first.'}), 400
        
        # Classify image
        result = classify_image(file_path)
        
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 400
    
    except Exception as e:
        print(f"[ERROR] Prediction route error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error occurred.'}), 500


@app.route('/health', methods=['GET'])
def health():
    """Check server and model status"""
    return jsonify({
        'status': 'ready',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    })


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 50MB.'}), 413


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server error"""
    return jsonify({'success': False, 'error': 'Internal server error occurred.'}), 500


# ============================================================================
# APPLICATION STARTUP
# ============================================================================

if __name__ == '__main__':
    # Load model on startup
    print("[INFO] Loading YOLOv8 Classification model...")
    if load_model():
        print("[SUCCESS] Application ready to serve predictions")
    else:
        print("[WARNING] Application started but model failed to load")
    
    # Run Flask development server
    app.run(debug=True, host='0.0.0.0', port=5000)
