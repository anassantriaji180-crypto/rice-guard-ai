# RiceGuard AI - Deployment Guide

Complete guide for deploying RiceGuard AI to production environments.

## Pre-Deployment Checklist

- [ ] All dependencies installed and tested
- [ ] Model file (`best.pt`) verified and optimized
- [ ] Static files compressed and cached
- [ ] Environment variables configured
- [ ] Error handling thoroughly tested
- [ ] Security headers configured
- [ ] Logging system implemented
- [ ] Backup strategy in place

## Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/riceguard-ai.git
cd riceguard-ai

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run development server
python app.py
```

Access at: `http://localhost:5000`

## Production Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides serverless deployment with automatic scaling.

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Follow prompts to connect project
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    },
    {
      "src": "static/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1",
      "headers": {
        "cache-control": "max-age=31536000"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/app.py"
    }
  ]
}
```

### Option 2: Heroku

Heroku offers easy one-click deployments with free tier options.

```bash
# 1. Create Procfile
echo "web: python app.py" > Procfile

# 2. Create requirements.txt (already exists)

# 3. Deploy via Heroku CLI
heroku create riceguard-ai
git push heroku main

# 4. View logs
heroku logs --tail
```

**Note**: Heroku may be slower for ML inference; use professional dynos for production.

### Option 3: AWS EC2

Deploy on AWS for maximum control and scalability.

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# - t3.medium or larger (4GB RAM minimum)
# - 20GB storage minimum
# - Security group: allow 80, 443, 5000

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt-get update
sudo apt-get install python3-pip python3-venv
sudo apt-get install libopencv-dev

# 4. Clone repository
git clone https://github.com/your-org/riceguard-ai.git
cd riceguard-ai

# 5. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 6. Install Python dependencies
pip install -r requirements.txt

# 7. Run with Gunicorn (production WSGI server)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option 4: Docker

Containerize RiceGuard for consistent deployment.

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p static/uploads

# Expose port
EXPOSE 5000

# Run application
CMD ["python", "app.py"]
```

**Build and run**:
```bash
docker build -t riceguard-ai:latest .
docker run -p 5000:5000 -v ./static/uploads:/app/static/uploads riceguard-ai:latest
```

### Option 5: Google Cloud Run

Serverless deployment on Google Cloud.

```bash
# 1. Create Cloud Run service
gcloud run deploy riceguard-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# 2. View service details
gcloud run describe riceguard-ai --region us-central1
```

## Environment Configuration

### Environment Variables

Create `.env` file (never commit to version control):

```bash
# Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-random-secret-key

# Application
MAX_UPLOAD_MB=50
MODEL_PATH=best.pt

# Logging
LOG_LEVEL=INFO
LOG_FILE=riceguard.log

# Security
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=3600
```

### Load environment variables in Flask:

```python
from dotenv import load_dotenv
import os

load_dotenv()

app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_UPLOAD_MB', 50)) * 1024 * 1024
MODEL_PATH = os.getenv('MODEL_PATH', 'best.pt')
```

## Performance Optimization

### Frontend Optimization

```bash
# Minify CSS
npx csso static/css/style.css -o static/css/style.min.css

# Optimize images
imagemin static/images/*.png --out-dir=static/images
```

### Backend Optimization

```python
# Cache model loading
from functools import lru_cache

@lru_cache(maxsize=1)
def load_model():
    return YOLO(MODEL_PATH)

# Use threading for non-blocking I/O
from threading import Thread

def predict_async(image_path):
    Thread(target=classify_image, args=(image_path,)).start()
```

### CDN Configuration

Configure CDN for static assets (CloudFlare, AWS CloudFront):

```bash
# Set cache headers for static files
Cache-Control: max-age=31536000, public  # 1 year for versioned assets
Cache-Control: max-age=86400, public     # 1 day for index.html
```

## Monitoring & Logging

### Application Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('riceguard.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info("Application started")
```

### Health Checks

```bash
# Set up monitoring
curl -s http://localhost:5000/health | jq '.model_loaded'

# Automated monitoring with cron
*/5 * * * * curl -s http://localhost:5000/health || alert
```

### Error Tracking (Optional)

Integrate with Sentry for error tracking:

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="https://examplePublicKey@o0.ingest.sentry.io/0",
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1
)
```

## Database Considerations

If storing predictions in database, use:

- **PostgreSQL** for production (AWS RDS, GCP Cloud SQL)
- **MongoDB** for document storage
- **Redis** for caching

```python
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://user:password@host/dbname"
engine = create_engine(DATABASE_URL)

# Store prediction in database
from datetime import datetime

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True)
    disease = Column(String)
    confidence = Column(Float)
    image_path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
```

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic across multiple instances
   - AWS Application Load Balancer
   - Nginx reverse proxy
   - HAProxy

2. **Instance Configuration**:
   - Each instance: 4GB RAM minimum
   - Shared storage for uploads (AWS S3, Google Cloud Storage)
   - Stateless design for easy replication

### Vertical Scaling

1. **Increase Resources**: Larger instances for ML inference
   - GPU support: NVIDIA A100 for batch processing
   - Increase CPU cores: 8+ cores recommended
   - Increase RAM: 16GB+ for model caching

2. **Optimize Model**:
   - Model quantization for faster inference
   - Model pruning to reduce size
   - ONNX export for cross-platform compatibility

## Security Hardening

### HTTPS/TLS

```bash
# Using Let's Encrypt (free SSL certificates)
sudo apt-get install certbot python3-certbot-nginx

certbot certonly --standalone -d yourdomain.com
```

### Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/predict', methods=['POST'])
@limiter.limit("10 per hour")
def predict():
    # Limited to 10 predictions per hour
    pass
```

### CORS Configuration

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Input Validation

```python
from werkzeug.utils import secure_filename

def validate_file(file):
    if not file:
        return False
    if file.filename == '':
        return False
    if file.filename != secure_filename(file.filename):
        return False
    if not allowed_file(file.filename):
        return False
    return True

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'webp'}
```

## Rollback Strategy

Maintain previous versions for quick rollback:

```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Rollback procedure
git checkout v1.0.0
# Redeploy with previous version
```

## Backup & Recovery

### Regular Backups

```bash
# Daily backup of uploaded images
0 2 * * * tar -czf /backups/riceguard-$(date +%Y%m%d).tar.gz /app/static/uploads/

# Upload to cloud storage
0 3 * * * aws s3 cp /backups/ s3://riceguard-backups/ --recursive
```

### Disaster Recovery Plan

1. **Model Backup**: Keep multiple copies of `best.pt`
2. **Database Backup**: Daily snapshots (if using database)
3. **Code Repository**: Maintain Git history
4. **Configuration Backup**: Store environment variables securely

## Cost Optimization

### Budget Monitoring

- Vercel: ~$20-50/month (includes bandwidth)
- Heroku: ~$50-200/month (professional dynos)
- AWS EC2: ~$30-100/month (on-demand)
- Google Cloud Run: ~$0-50/month (pay per request)

### Cost Reduction Tips

- Use spot instances for non-critical workloads
- Implement aggressive caching
- Optimize image storage (compress, delete old uploads)
- Use managed services (RDS, S3) for better pricing

## Maintenance

### Regular Tasks

- Monitor disk space (uploads accumulate)
- Update dependencies monthly
- Review and optimize database queries
- Check error logs weekly
- Update SSL certificates before expiration

### Version Updates

```bash
# Check for package updates
pip list --outdated

# Update safely
pip install --upgrade package-name
# Test thoroughly before production deployment
```

## Post-Deployment Verification

```bash
# 1. Health check
curl https://yourdomain.com/health

# 2. Test prediction
curl -X POST -F "file=@test.jpg" https://yourdomain.com/predict

# 3. Monitor performance
# Check average response time < 500ms
# Check error rate < 1%

# 4. Test across devices
# Desktop browser
# Mobile browser
# Different network speeds
```

---

**Last Updated**: June 18, 2026  
**Version**: 1.0.0
