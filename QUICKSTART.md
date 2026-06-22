# RiceGuard AI - Quick Start Guide

Get RiceGuard AI running in minutes!

## Prerequisites

- Python 3.9 or higher
- pip or conda package manager
- 2GB available disk space
- Modern web browser

## Installation (5 minutes)

### Step 1: Clone or Navigate to Project

```bash
cd /path/to/riceguard-ai
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** This will install:
- Flask (web framework)
- Pillow (image processing)
- NumPy (numerical computing)
- Ultralytics YOLOv8 (deep learning model)
- OpenCV (computer vision)

### Step 4: Run Application

```bash
python app.py
```

You should see:
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

### Step 5: Open in Browser

Navigate to: **http://localhost:5000**

Done! You're ready to detect rice diseases.

---

## Quick Usage

### Upload an Image

1. Click **"Detection"** in the navigation
2. Drag and drop a rice leaf image or click to browse
3. View results instantly

### Use Camera (Mobile)

1. Go to **"Detection"** section
2. Click **"Start Camera"** button
3. Frame the rice leaf and capture
4. Results display automatically

### View Prediction History

1. Click **"History"** in the navigation
2. See all previous predictions with timestamps
3. Predictions are stored locally in your browser

### Check System Status

1. Click **"Status"** tab
2. Monitor server health and model status
3. View prediction count and average confidence

---

## API Usage

### Test with cURL

```bash
# Classify a rice leaf image
curl -X POST -F "file=@rice_leaf.jpg" http://localhost:5000/predict

# Expected response:
# {
#   "success": true,
#   "disease": "Blast",
#   "confidence": 95.5,
#   "probabilities": {
#     "Blast": 95.5,
#     "Blight": 3.2,
#     "Tungro": 1.3
#   },
#   "timestamp": "2026-06-18 08:47:14"
# }
```

### Test with Python

```python
import requests

with open('rice_leaf.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:5000/predict', files=files)
    result = response.json()
    print(f"Disease: {result['disease']}")
    print(f"Confidence: {result['confidence']}%")
```

### Test with JavaScript

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:5000/predict', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(result => {
  console.log(`Disease: ${result.disease}`);
  console.log(`Confidence: ${result.confidence}%`);
});
```

---

## File Structure

```
riceguard-ai/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Full documentation
├── API.md                # API reference
├── DEPLOYMENT.md         # Deployment guide
│
├── templates/
│   └── index.html        # Web interface
│
├── static/
│   ├── css/style.css     # Styling
│   ├── js/app.js         # Frontend logic
│   ├── images/           # Generated images
│   └── uploads/          # Prediction uploads
│
└── venv/                 # Virtual environment
```

---

## Troubleshooting

### Port Already in Use

If port 5000 is already in use:

```bash
# On Linux/macOS, find process:
lsof -i :5000
kill -9 <PID>

# Or run on different port:
export FLASK_ENV=development
python app.py --port 8000
```

### Model Not Loading

If you see "Model failed to load" error:

```bash
# Reinstall Ultralytics:
pip uninstall ultralytics -y
pip install ultralytics==8.0.228

# Download model:
python -c "from ultralytics import YOLO; YOLO('yolov8m-cls.pt')"
```

### Image Upload Error

Supported formats: **PNG, JPG, JPEG**
Maximum file size: **50MB**

### Slow Predictions

First prediction may take 2-3 seconds (model warmup).  
Subsequent predictions: ~250-500ms

---

## Performance Tips

1. **Use High-Resolution Images**
   - Minimum: 224x224 pixels
   - Recommended: 600x400 pixels or larger

2. **Good Lighting**
   - Natural light or bright artificial light
   - Avoid shadows and glare

3. **Clear Focus**
   - Focus on the affected leaf area
   - Capture disease symptoms clearly

4. **Proper Angle**
   - 45-90 degree angle to camera
   - Disease area should fill 30-50% of image

---

## Advanced Configuration

### Change Model Size

Edit `app.py` line for smaller/larger models:

```python
# Small (lightweight, faster)
model = YOLO('yolov8n-cls.pt')

# Medium (default, balanced)
model = YOLO('yolov8m-cls.pt')

# Large (more accurate, slower)
model = YOLO('yolov8l-cls.pt')
```

### Custom Confidence Threshold

```python
# Adjust in app.py predict_disease function:
confidence_threshold = 0.5  # Change to desired threshold
```

### Enable Debug Mode

```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

---

## Next Steps

1. **Read Documentation**
   - Full guide: `README.md`
   - API reference: `API.md`
   - Deployment: `DEPLOYMENT.md`

2. **Deploy to Production**
   - Docker: `docker build -t riceguard-ai .`
   - Cloud: See `DEPLOYMENT.md`
   - Heroku: `git push heroku main`

3. **Customize**
   - Modify colors in `static/css/style.css`
   - Update text in `templates/index.html`
   - Add features in `app.py` and `static/js/app.js`

4. **Share**
   - Host on cloud platform
   - Share URL with farmers and agricultural experts
   - Gather feedback and iterate

---

## Support

- **Documentation:** See README.md, API.md, DEPLOYMENT.md
- **Issues:** Check troubleshooting section above
- **Questions:** Email support@riceguard.ai

---

## License

This project is provided for educational and agricultural purposes.

---

**Version:** 1.0  
**Last Updated:** 2026-06-18  
**Status:** Production Ready ✅
