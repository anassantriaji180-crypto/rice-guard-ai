# RiceGuard AI - Development Guide

This guide helps developers customize, extend, and maintain RiceGuard AI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│  HTML5 | CSS3 | JavaScript (ES6+) | Chart.js          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     │
┌────────────────────┴────────────────────────────────────┐
│              Flask Web Server                           │
│  app.py - Routes, file upload, predictions            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│            YOLOv8 Classification Model                  │
│  Deep Learning | Ultralytics | 96%+ Accuracy         │
└─────────────────────────────────────────────────────────┘
```

## File Structure & Responsibilities

### Backend (Python)

**app.py** (8.5 KB)
- Flask application initialization
- Route definitions
- Model loading and caching
- Image preprocessing
- Prediction logic
- Error handling

**Key Functions:**
- `load_model()` - Load YOLOv8 model once on startup
- `predict_disease()` - Classify rice leaf image
- `get_history()` - Retrieve prediction history
- `clear_history()` - Clear stored predictions

### Frontend (HTML/CSS/JS)

**templates/index.html** (23.8 KB)
- Single-page application
- All UI sections
- Form inputs
- Charts and visualizations
- Bootstrap structure

**Sections:**
- Navigation (sticky header)
- Hero (main introduction)
- About (6 feature cards)
- Diseases (3 disease cards with images)
- Detection (main functionality)
- Results (prediction display)
- Analytics (probability chart)
- History (prediction log)
- Status (server health)
- Model Info (specifications)
- Contact (feedback form)
- Footer (branding)

**static/css/style.css** (1.6 MB)
- Global styles
- CSS variables for theming
- Responsive breakpoints
- Component styles
- Animations

**Color Scheme (CSS Variables):**
```css
--primary: #16a34a (green)
--secondary: #10b981 (emerald)
--success: #22c55e (light green)
--warning: #ef4444 (red)
--text-primary: #1f2937 (dark gray)
--text-secondary: #6b7280 (medium gray)
--surface: #ffffff (white)
--background: #f9fafb (off-white)
--border-color: #e5e7eb (light gray)
```

**static/js/app.js** (717 lines)
- File upload handling
- Camera integration
- Form validation
- API communication
- Chart.js initialization
- Local storage management
- UI interactions

## Development Workflow

### 1. Local Development

```bash
# Activate virtual environment
source venv/bin/activate

# Run development server
python app.py

# Open http://localhost:5000
```

### 2. Hot Reload (Optional)

For automatic code reloading on changes:

```bash
# Install flask-reload (optional)
pip install flask-reload

# Or use Flask built-in reload:
FLASK_ENV=development FLASK_DEBUG=1 python app.py
```

### 3. Testing API Endpoints

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test prediction
curl -X POST -F "file=@test.jpg" http://localhost:5000/predict

# Test history
curl http://localhost:5000/history

# Test model info
curl http://localhost:5000/model-info
```

## Customization Guide

### Change Color Scheme

Edit `static/css/style.css`:

```css
/* Line ~50 - CSS Variables */
:root {
    --primary: #16a34a;      /* Main brand color */
    --secondary: #10b981;    /* Secondary color */
    --text-primary: #1f2937; /* Main text */
}
```

### Modify Disease Classes

Edit `app.py`:

```python
# Line ~15
DISEASE_CLASSES = ['Blast', 'Blight', 'Tungro']  # Add/remove classes
```

Update `templates/index.html` disease cards accordingly.

### Add New Sections

1. Add HTML to `templates/index.html`
2. Add CSS to `static/css/style.css`
3. Add navigation link
4. Add JavaScript interaction if needed

Example:

```html
<section id="new-section" class="new-section">
    <h2>Section Title</h2>
    <!-- Your content -->
</section>
```

### Change Model

Edit `app.py`:

```python
# Line ~30 - Different YOLOv8 sizes
model = YOLO('yolov8n-cls.pt')  # nano - fastest
model = YOLO('yolov8s-cls.pt')  # small
model = YOLO('yolov8m-cls.pt')  # medium (default)
model = YOLO('yolov8l-cls.pt')  # large - most accurate
```

### Adjust Confidence Threshold

Edit `app.py` `predict_disease()` function:

```python
# Line ~120
confidence_threshold = 0.5  # Minimum confidence to report
```

## Code Style Guide

### Python

Follow PEP 8:
- 4 spaces indentation
- Snake_case for variables/functions
- CamelCase for classes
- Docstrings for functions

```python
def predict_disease(file_path):
    """
    Classify a rice leaf image for disease.
    
    Args:
        file_path (str): Path to image file
        
    Returns:
        dict: Prediction result with disease and confidence
    """
    # Implementation
    pass
```

### JavaScript

- camelCase for variables/functions
- Use `const` by default, `let` if needed, avoid `var`
- Add comments for complex logic
- Use descriptive variable names

```javascript
const predictDisease = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/predict', {
        method: 'POST',
        body: formData
    });
    
    return response.json();
};
```

### HTML/CSS

- Use semantic HTML5 elements
- Use BEM naming for CSS classes
- Mobile-first responsive design
- Accessible (ARIA labels, alt text)

```html
<section class="disease-card">
    <img src="..." alt="Rice Blast disease symptoms">
    <h3>Rice Blast</h3>
</section>
```

## Adding Features

### Feature: Email Notifications

1. **Backend** - Add email sending:
```python
from flask_mail import Mail, Message

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
mail = Mail(app)

@app.route('/notify', methods=['POST'])
def send_notification():
    msg = Message('Disease Detected!')
    mail.send(msg)
```

2. **Frontend** - Add email input in contact form

3. **Update** - requirements.txt with `Flask-Mail`

### Feature: User Accounts

1. **Backend** - Add authentication:
```python
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy(app)
login_manager = LoginManager(app)
```

2. **Database** - Add users table with predictions

3. **Frontend** - Add login/signup pages

### Feature: Batch Processing

1. **Backend** - Add endpoint:
```python
@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    files = request.files.getlist('files')
    results = [predict_disease_internal(f) for f in files]
    return jsonify({'results': results})
```

2. **Frontend** - Allow multiple file selection

## Performance Optimization

### Frontend

1. **Lazy Loading Images**
```javascript
// Use IntersectionObserver
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src;
        }
    });
});
```

2. **Minimize CSS/JS**
```bash
# Install minifiers
npm install cssnano terser

# Minify files
npx terser static/js/app.js -o static/js/app.min.js
```

3. **Asset Compression**
```bash
# Compress images
optipng -o2 static/images/*.png
jpegoptim static/images/*.jpg
```

### Backend

1. **Model Caching**
- Model is loaded once on startup
- Reused for all predictions
- Reduces memory usage

2. **Image Preprocessing**
- Limit file size to 50MB
- Resize large images
- Optimize color channels

3. **Request Logging**
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.before_request
def log_request():
    logger.info(f'{request.method} {request.path}')
```

## Testing

### Manual Testing

1. **Functionality**
   - Test file upload
   - Test camera capture
   - Verify predictions
   - Check history

2. **Responsive Design**
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

3. **Browser Compatibility**
   - Chrome, Firefox, Safari, Edge
   - Latest versions

### Automated Testing

Create `test_app.py`:

```python
import unittest
from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        
    def test_health(self):
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        
    def test_predict_invalid_file(self):
        response = self.app.post('/predict')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
```

Run tests:
```bash
python -m pytest test_app.py -v
```

## Debugging

### Browser Console

Check for JavaScript errors:
```bash
# In Chrome/Firefox Developer Tools
F12 > Console tab
```

### Flask Debug Mode

```bash
FLASK_DEBUG=1 python app.py
```

### Logging

```python
import logging
logging.debug('Debug message')
logging.info('Info message')
logging.warning('Warning message')
logging.error('Error message')
```

## Version Control

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Review and merge
```

### Commit Messages

- Use imperative mood: "Add feature" not "Added feature"
- Keep messages concise
- Reference issues: "Fix #123"

```
Add disease notification feature

- Implement email sending on disease detection
- Add email configuration to settings
- Update requirements.txt
```

## Documentation

### Docstrings

Python (Google style):
```python
def predict_disease(image_path):
    """Predict rice leaf disease from image.
    
    Args:
        image_path (str): Path to the image file.
        
    Returns:
        dict: Contains 'disease', 'confidence', 'probabilities'.
        
    Raises:
        FileNotFoundError: If image file not found.
        ValueError: If image format not supported.
    """
```

### Code Comments

```python
# Bad - obvious comment
count = count + 1  # Increment count

# Good - explains why
# Use exponential backoff to avoid overwhelming the API
time.sleep(2 ** retry_count)
```

## Deployment Considerations

### Environment Variables

Create `.env` file:
```
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=your-secret-key
MODEL_PATH=/path/to/model
```

Load in app:
```python
from dotenv import load_dotenv
import os

load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY')
```

### Production Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Use production WSGI server (Gunicorn)
- [ ] Enable HTTPS/SSL
- [ ] Set strong SECRET_KEY
- [ ] Configure CORS properly
- [ ] Set up logging
- [ ] Monitor error rates
- [ ] Regular backups
- [ ] Update dependencies monthly

## Resources

- **Flask Documentation:** https://flask.palletsprojects.com/
- **Ultralytics YOLOv8:** https://docs.ultralytics.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Chart.js:** https://www.chartjs.org/
- **MDN Web Docs:** https://developer.mozilla.org/

---

**Version:** 1.0  
**Last Updated:** 2026-06-18  
**Maintainer:** Development Team
