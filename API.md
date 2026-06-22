# RiceGuard AI - API Documentation

## Overview

RiceGuard AI provides a RESTful API for rice leaf disease detection using YOLOv8 classification. This documentation describes all available endpoints and their usage.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible in the development environment.

## Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Description:** Check the health status of the API and model load status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-06-18 08:47:14"
}
```

**Status Codes:**
- `200 OK` - Server is healthy
- `503 Service Unavailable` - Server is not ready

---

### 2. Predict Disease

**Endpoint:** `POST /predict`

**Description:** Submit an image of a rice leaf for disease classification.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Parameter:** `file` (required) - Image file (PNG, JPG, JPEG)
- **Max File Size:** 50MB

**cURL Example:**
```bash
curl -X POST -F "file=@rice_leaf.jpg" http://localhost:5000/predict
```

**Python Example:**
```python
import requests

with open('rice_leaf.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:5000/predict', files=files)
    result = response.json()
    print(result)
```

**Response:**
```json
{
  "success": true,
  "disease": "Blast",
  "confidence": 99.97,
  "image": "static/uploads/upload_20260618_084714.png",
  "timestamp": "2026-06-18 08:47:14",
  "probabilities": {
    "Blast": 0.029,
    "Blight": 99.968,
    "Tungro": 0.002
  }
}
```

**Response Fields:**
- `success` (boolean) - Whether prediction was successful
- `disease` (string) - Predicted disease name (Blast, Blight, or Tungro)
- `confidence` (float) - Confidence percentage (0-100)
- `image` (string) - Path to saved image file
- `timestamp` (string) - Prediction timestamp
- `probabilities` (object) - Confidence scores for each disease class

**Status Codes:**
- `200 OK` - Prediction successful
- `400 Bad Request` - Invalid image or missing file
- `500 Internal Server Error` - Server error

---

### 3. Get History

**Endpoint:** `GET /history`

**Description:** Retrieve all previous predictions from the session.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "predictions": [
    {
      "disease": "Blast",
      "confidence": 95.5,
      "timestamp": "2026-06-18 08:45:00",
      "image": "static/uploads/upload_20260618_084500.png"
    },
    {
      "disease": "Blight",
      "confidence": 87.3,
      "timestamp": "2026-06-18 08:43:00",
      "image": "static/uploads/upload_20260618_084300.png"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - History retrieved successfully

---

### 4. Clear History

**Endpoint:** `POST /clear-history`

**Description:** Clear all predictions from the session history.

**Response:**
```json
{
  "success": true,
  "message": "History cleared successfully"
}
```

**Status Codes:**
- `200 OK` - History cleared successfully
- `500 Internal Server Error` - Server error

---

### 5. Get Model Info

**Endpoint:** `GET /model-info`

**Description:** Get detailed information about the YOLOv8 classification model.

**Response:**
```json
{
  "success": true,
  "model": {
    "name": "YOLOv8 Classification",
    "framework": "Ultralytics",
    "input_size": "224x224",
    "classes": ["Blast", "Blight", "Tungro"],
    "num_classes": 3,
    "accuracy": "96.2%",
    "precision": "95.8%",
    "recall": "96.5%",
    "f1_score": "96.1%"
  }
}
```

**Status Codes:**
- `200 OK` - Model info retrieved successfully
- `500 Internal Server Error` - Server error

---

## Error Handling

All errors return a JSON response with the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Responses

**Invalid Image Format:**
```json
{
  "success": false,
  "error": "Invalid image format. Supported formats: PNG, JPG, JPEG"
}
```

**File Too Large:**
```json
{
  "success": false,
  "error": "File size exceeds 50MB limit"
}
```

**Model Not Loaded:**
```json
{
  "success": false,
  "error": "Model is not loaded. Please check server health."
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Each endpoint can be called unlimited times.

Future versions may include:
- IP-based rate limiting
- API key-based rate limiting
- Per-user quotas

---

## Data Formats

### Supported Image Formats
- PNG (.png)
- JPEG (.jpg, .jpeg)
- Maximum file size: 50MB
- Recommended resolution: 224x224 or higher

### Disease Classes
1. **Blast** - Most destructive rice disease with characteristic brown/gray lesions
2. **Blight** - Bacterial disease with water-soaked yellow streaks
3. **Tungro** - Viral disease causing yellowing and leaf stunting

---

## Examples

### JavaScript/Node.js
```javascript
async function predictDisease(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch('http://localhost:5000/predict', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log(`Disease: ${result.disease}`);
  console.log(`Confidence: ${result.confidence}%`);
}
```

### React
```jsx
import { useState } from 'react';

export function DiseaseDetector() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  
  const handleUpload = async (e) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/predict', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setResult(data);
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button onClick={handleUpload}>Detect Disease</button>
      {result && (
        <div>
          <p>Disease: {result.disease}</p>
          <p>Confidence: {result.confidence}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

1. **Image Quality:** Provide clear, well-lit images of rice leaves for best results
2. **Angle:** Capture leaves at 45-90 degree angles to the camera
3. **Focus:** Ensure the affected area is in focus and clearly visible
4. **Lighting:** Use natural or bright artificial lighting to avoid shadows
5. **Size:** Ensure the diseased area takes up at least 30% of the image

---

## Version Information

- **API Version:** 1.0
- **Model Version:** YOLOv8
- **Last Updated:** 2026-06-18

---

## Support

For issues, questions, or feature requests, please contact:
- Email: support@riceguard.ai
- Website: www.riceguard.ai
