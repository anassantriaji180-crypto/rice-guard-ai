# RiceGuard AI - Implementation Guide

## Quick Start

### Installation
```bash
# Install dependencies
pip install flask pillow ultralytics

# Place your YOLOv8 model
cp your-model.pt model/best.pt

# Run the application
python app.py

# Open in browser
# http://localhost:5000
```

## What's New

### 1. Real-Time Camera System

**Before:** Users had to upload an image first before using the camera.

**Now:** Camera is immediately available and works in real-time.

**How it Works:**
```javascript
// Camera starts immediately without upload requirement
toggleCamera() → Request permission → Display live stream → Capture → Classify

// User flow:
1. Click "📷 Start Camera"
2. Browser requests camera permission
3. Live video displays with "LIVE" indicator
4. Click "📸 Capture" to take photo
5. Results appear instantly
```

### 2. Refresh & New Scan Controls

**Two Control Buttons** appear after classification:

#### 🔄 Refresh Analysis
```javascript
resetScanner() 
// Clears results while keeping current image
// Re-analyzes with same/different parameters
// Use case: Verify results, compare models
```

#### 📸 New Scan
```javascript
startNewScan()
// Clears everything: results, image, UI
// Returns to initial upload/camera state
// Use case: Start fresh without page reload
```

### 3. Modern AgriTech Theme

**Color Palette Applied Throughout:**
- Primary: `#16a34a` (Agricultural green)
- Secondary: `#059669` (Emerald)
- Accent: `#10b981` (Vibrant green)

**Design Elements:**
- Glassmorphism with blur effects
- Soft shadows for depth
- Smooth animations
- Premium academic appearance

## Code Structure

### JavaScript Functions

```javascript
// Camera Functions
toggleCamera()           // Start/stop camera
startCamera()           // Initialize video stream
stopCamera()            // Close stream
capturePhoto()          // Capture and classify
switchCamera()          // Toggle front/rear

// Refresh Functions (NEW)
resetScanner()          // Clear results only
startNewScan()          // Full reset
showStatusMessage()     // Status feedback

// Utility Functions
classifyImage()         // Send to backend
displayPreview()        // Show image
updateActiveNavLink()   // Navigation sync
```

### CSS Classes

```css
/* New Refresh Controls */
.refresh-controls       /* Container for buttons */
.refresh-btn           /* Primary refresh button */
.new-scan-btn          /* Secondary new scan button */

/* Updated Colors Throughout */
.detection-card        /* Glassmorphic cards */
.camera-btn            /* Camera buttons */
.cta-button            /* Call-to-action */
.progress-fill         /* Progress bars */
```

### HTML Structure

```html
<!-- Refresh Controls (After Results) -->
<div class="refresh-controls">
    <button class="refresh-btn" onclick="resetScanner()">
        🔄 Refresh Analysis
    </button>
    <button class="new-scan-btn" onclick="startNewScan()">
        📸 New Scan
    </button>
</div>

<!-- Camera Always Available -->
<button class="camera-btn" id="cameraBtn" onclick="toggleCamera()">
    📷 Start Camera
</button>
```

## Workflow Examples

### Example 1: Real-Time Camera Scanning
```
1. User opens app
2. Immediately clicks "📷 Start Camera"
   ↓ (No need to upload first)
3. Browser requests camera permission
4. Live video feed appears
5. User aims at rice leaf
6. Clicks "📸 Capture"
7. Photo classifies instantly
8. Results show with refresh options
```

### Example 2: Using Refresh Controls
```
1. User captures image → Results appear
2. Option 1: Click "🔄 Refresh Analysis"
   ↓ Same image, new analysis
   ↓ Useful for verifying results
3. Option 2: Click "📸 New Scan"
   ↓ Clears everything
   ↓ Can upload new image or use camera again
```

### Example 3: Image Upload Flow
```
1. User opens app
2. Drags image onto upload zone
3. Preview appears
4. Classification happens automatically
5. Results display
6. Refresh or new scan options visible
```

## Mobile Optimization

### Touch-Friendly
- All buttons: minimum 44px height
- Proper spacing between interactive elements
- Landscape camera support

### Responsive Breakpoints
```css
Desktop (>1024px):  Two-column layouts
Tablet (768-1024px): Two-column layouts
Mobile (<768px):    Single-column layouts
```

### Mobile Camera
```javascript
// Automatically uses rear camera on mobile
facingMode: {
    ideal: 'environment'  // Rear camera by default
}

// User can switch to front camera if needed
switchCamera() // Toggles between 'environment' and 'user'
```

## Customization

### Change Colors

Edit `:root` in `static/css/style.css`:
```css
:root {
    --primary: #16a34a;        /* Main green */
    --secondary: #059669;      /* Emerald */
    --accent: #10b981;         /* Vibrant */
    --background: #f8fafc;     /* Off-white */
    --surface: #ffffff;        /* Pure white */
    /* ... more colors ... */
}
```

### Modify Buttons

Edit button classes:
```css
.camera-btn {
    background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
    /* ... styling ... */
}
```

### Adjust Animations

Edit animation speeds:
```css
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Change animation duration */
.live-pulse {
    animation: pulse 1.5s ease-in-out infinite;  /* 1.5s duration */
}
```

## Troubleshooting

### Camera Not Working
```javascript
// Check if camera is supported
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("Camera not supported");
}

// Check permissions in browser settings
// Chrome: Settings → Privacy → Camera
// Firefox: about:preferences → Privacy → Permissions
```

### Results Not Displaying
```javascript
// Check model file exists
// Should be at: model/best.pt

// Check Flask backend responses
// Open browser DevTools → Network tab
// Look for /predict endpoint calls
```

### Styling Not Applied
```javascript
// Clear browser cache
// Ctrl+Shift+Del → Clear all

// Hard refresh page
// Ctrl+Shift+R (Windows/Linux)
// Cmd+Shift+R (Mac)

// Check CSS file is linked
// In DevTools → Sources → static/css/style.css
```

## Performance Tips

### Optimize Images
```javascript
// Images should be under 5MB
// Recommended: 1-2MB
// Formats: PNG, JPG, WebP

// Compression tools:
// https://tinypng.com
// https://compressor.io
```

### Camera Performance
```javascript
// Set reasonable video constraints
const constraints = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
};

// Avoid excessive resolutions that strain device
```

### Animation Performance
```css
/* Use GPU-accelerated properties */
transform: translateY(-2px);  /* Good */
opacity: 0.9;                  /* Good */

/* Avoid these */
left: 10px;                    /* Bad - uses reflow */
width: 100px;                  /* Bad - uses reflow */
```

## API Integration

### Backend Expects

**POST `/predict`**
```python
{
    'image': binary data or base64 string
}

Response:
{
    'disease': 'disease_name',
    'confidence': 0.95,
    'time': 0.234,
    'probabilities': {
        'disease1': 0.95,
        'disease2': 0.04,
        'disease3': 0.01
    }
}
```

### Frontend Sends

```javascript
// From file upload
const formData = new FormData();
formData.append('image', file);

// From camera capture
canvas.toBlob((blob) => {
    const file = new File([blob], 'capture.png', {type: 'image/png'});
    classifyImage(file);
});
```

## Security Considerations

### CORS Headers
```python
# Flask app.py
@app.after_request
def set_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response
```

### Input Validation
```javascript
// Check file type
if (!file.type.startsWith('image/')) {
    showStatusMessage('Invalid file type', 'error');
}

// Check file size
const maxSize = 50 * 1024 * 1024;  // 50MB
if (file.size > maxSize) {
    showStatusMessage('File too large', 'error');
}
```

## Testing Checklist

- [ ] Camera starts immediately
- [ ] Camera capture sends to backend
- [ ] Results display correctly
- [ ] Refresh button clears results
- [ ] New scan button resets everything
- [ ] Colors match AgriTech theme
- [ ] Mobile layout responsive
- [ ] Touch buttons work on mobile
- [ ] Camera permission dialog appears
- [ ] Error messages display correctly

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest 2 versions |
| Firefox | ✅ Full | Latest 2 versions |
| Safari | ✅ Full | iOS 13+ required |
| Edge | ✅ Full | Latest version |
| Mobile Chrome | ✅ Full | Android 6+ |
| Mobile Safari | ✅ Full | iOS 13+ |

## Support & Issues

### Common Issues

**Camera Permission Denied**
- Solution: Check browser camera settings
- Reset in browser privacy settings
- Try different browser

**Model Not Loading**
- Check file path: `model/best.pt`
- Verify YOLOv8 installation
- Check file permissions

**Slow Performance**
- Reduce video resolution
- Close other browser tabs
- Check network connection

## Next Steps

1. **Deploy**: Follow production deployment guide
2. **Customize**: Modify colors and styling as needed
3. **Integrate**: Connect to your YOLOv8 model
4. **Test**: Verify all features work
5. **Monitor**: Track usage and performance

---

**Documentation Version:** 1.0
**Last Updated:** 2026-06-18
**Status:** Production Ready
