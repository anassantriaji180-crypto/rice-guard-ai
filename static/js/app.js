/* ========================================================================
   RICE DISEASE AI DETECTION - JAVASCRIPT APPLICATION
   Production-Quality Frontend Logic
   ======================================================================== */

// ============================================================================
// APPLICATION STATE
// ============================================================================

const appState = {
    currentImage: null,
    currentPrediction: null,
    predictionHistory: [],
    cameraActive: false,
    currentCameraStream: null,
    cameraFacingMode: 'environment',
    isLoading: false,
    supportsCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('[v0] Initializing Rice Disease AI Application...');
    
    // Load history from localStorage
    loadPredictionHistory();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check system health
    checkSystemHealth();
    
    // Setup auto-health check (every 30 seconds)
    setInterval(checkSystemHealth, 30000);
    
    console.log('[v0] Application initialized successfully');
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Upload zone
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--secondary)';
        uploadZone.style.background = 'linear-gradient(135deg, rgba(27, 94, 32, 0.1) 0%, rgba(67, 160, 71, 0.1) 100%)';
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--primary)';
        uploadZone.style.background = 'linear-gradient(135deg, rgba(27, 94, 32, 0.02) 0%, rgba(67, 160, 71, 0.02) 100%)';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary)';
        uploadZone.style.background = 'linear-gradient(135deg, rgba(27, 94, 32, 0.02) 0%, rgba(67, 160, 71, 0.02) 100%)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Scroll to section
            const element = document.getElementById(section);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // History search and sort
    document.getElementById('searchInput').addEventListener('input', updateHistoryDisplay);
    document.getElementById('sortSelect').addEventListener('change', updateHistoryDisplay);
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

// ============================================================================
// FILE UPLOAD HANDLING
// ============================================================================

function handleFileSelect() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatusMessage('No file selected', 'error');
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showStatusMessage('Please upload a valid image file', 'error');
        return;
    }
    
    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showStatusMessage('File too large. Maximum size is 50MB', 'error');
        return;
    }
    
    // Read and display preview
    const reader = new FileReader();
    reader.onload = (e) => {
        appState.currentImage = e.target.result;
        displayPreview(e.target.result);
        
        // Auto-classify
        setTimeout(() => {
            classifyImage(file);
        }, 300);
    };
    
    reader.onerror = () => {
        showStatusMessage('Failed to read file', 'error');
    };
    
    reader.readAsDataURL(file);
}

function displayPreview(imageSrc) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const uploadZone = document.getElementById('uploadZone');
    
    previewImage.src = imageSrc;
    previewContainer.style.display = 'block';
    uploadZone.style.display = 'none';
}

function resetPreview() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    previewContainer.style.display = 'none';
    uploadZone.style.display = 'block';
    fileInput.value = '';
    appState.currentImage = null;
}

// ============================================================================
// CAMERA FUNCTIONALITY
// ============================================================================

async function toggleCamera() {
    if (appState.cameraActive) {
        stopCamera();
    } else {
        startCamera();
    }
}

async function startCamera() {
    if (!appState.supportsCamera) {
        showStatusMessage('Camera not supported on this device', 'error');
        return;
    }
    
    try {
        showStatusMessage('Requesting camera access...', 'warning');
        
        const constraints = {
            video: {
                facingMode: {
                    ideal: appState.cameraFacingMode
                },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        appState.currentCameraStream = stream;
        appState.cameraActive = true;
        
        const video = document.getElementById('cameraVideo');
        video.srcObject = stream;
        
        // Display camera controls
        document.getElementById('cameraContainer').style.display = 'block';
        document.getElementById('cameraBtn').textContent = '🎥 Camera Active';
        document.getElementById('cameraBtn').style.background = 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)';
        
        showStatusMessage('Camera active. Ready to capture!', 'success');
        updateCameraStatus(true);
        
        console.log('[v0] Camera started successfully');
        
    } catch (err) {
        console.error('[v0] Camera error:', err);
        
        if (err.name === 'NotAllowedError') {
            showStatusMessage('Camera access denied', 'error');
        } else if (err.name === 'NotFoundError') {
            showStatusMessage('No camera found on device', 'error');
        } else {
            showStatusMessage('Failed to access camera: ' + err.message, 'error');
        }
        
        updateCameraStatus(false);
    }
}

function stopCamera() {
    if (appState.currentCameraStream) {
        appState.currentCameraStream.getTracks().forEach(track => track.stop());
        appState.currentCameraStream = null;
    }
    
    appState.cameraActive = false;
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('cameraBtn').textContent = '📷 Start Camera';
    document.getElementById('cameraBtn').style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)';
    
    showStatusMessage('Camera stopped', 'warning');
    updateCameraStatus(false);
}

async function capturePhoto() {
    if (!appState.cameraActive) {
        showStatusMessage('Camera not active', 'error');
        return;
    }
    
    try {
        const video = document.getElementById('cameraVideo');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob and send to server
        canvas.toBlob((blob) => {
            const file = new File([blob], 'camera_capture.png', { type: 'image/png' });
            classifyImage(file);
            
            // Display preview
            const reader = new FileReader();
            reader.onload = (e) => {
                appState.currentImage = e.target.result;
                displayPreview(e.target.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/png');
        
        showStatusMessage('Photo captured!', 'success');
        
    } catch (err) {
        console.error('[v0] Capture error:', err);
        showStatusMessage('Failed to capture photo', 'error');
    }
}

async function switchCamera() {
    // Toggle between front and rear camera
    appState.cameraFacingMode = appState.cameraFacingMode === 'environment' ? 'user' : 'environment';
    
    stopCamera();
    setTimeout(() => {
        startCamera();
    }, 500);
}

// ============================================================================
// IMAGE CLASSIFICATION
// ============================================================================

async function classifyImage(file) {
    if (!appState.currentImage) {
        showStatusMessage('Please upload or capture an image first', 'error');
        return;
    }
    
    if (appState.isLoading) {
        showStatusMessage('Classification in progress...', 'warning');
        return;
    }
    
    try {
        appState.isLoading = true;
        showLoadingModal(true);
        showStatusMessage('Analyzing rice leaf...', 'warning');
        
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('[v0] Sending classification request...');
        
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        console.log('[v0] Response status:', response.status);
        
        const data = await response.json();
        
        if (data.success) {
            console.log('[v0] Prediction successful:', data);
            
            appState.currentPrediction = data;
            displayPredictionResult(data);
            addToPredictionHistory(data);
            updateHistoryDisplay();
            
            showStatusMessage('Classification complete!', 'success');
            showLoadingModal(false);
            
        } else {
            console.error('[v0] Prediction failed:', data.error);
            showStatusMessage(data.error || 'Classification failed', 'error');
            showLoadingModal(false);
        }
        
    } catch (err) {
        console.error('[v0] Classification error:', err);
        showStatusMessage('Failed to classify image: ' + err.message, 'error');
        showLoadingModal(false);
        
    } finally {
        appState.isLoading = false;
    }
}

// ============================================================================
// PREDICTION DISPLAY
// ============================================================================

function displayPredictionResult(prediction) {
    // Hide empty state
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
    
    // Update disease name
    document.getElementById('diseaseName').textContent = prediction.disease;
    
    // Update confidence
    const confidence = prediction.confidence;
    document.getElementById('confidenceValue').textContent = confidence.toFixed(2) + '%';
    
    // Animate circular progress
    const circleProgress = document.getElementById('circleProgress');
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (confidence / 100) * circumference;
    circleProgress.style.strokeDashoffset = offset;
    
    // Animate progress bar
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = confidence + '%';
    
    // Update prediction time
    document.getElementById('predictionTime').textContent = prediction.timestamp;
    
    // Update result image
    document.getElementById('resultImage').src = prediction.image;
    
    // Display all probabilities
    displayProbabilities(prediction.probabilities);
    
    // Scroll to results
    document.querySelector('.detection-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayProbabilities(probabilities) {
    const analyticsContainer = document.getElementById('analyticsContainer');
    const analyticsEmpty = document.getElementById('analyticsEmpty');
    const analyticsContent = document.getElementById('analyticsContent');
    
    let html = '';
    
    // Sort probabilities by value (descending)
    const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
    
    sorted.forEach((item, index) => {
        const disease = item[0];
        const probability = item[1];
        const isHighest = index === 0;
        
        html += `
            <div class="probability-item" style="${isHighest ? 'background: rgba(67, 160, 71, 0.1); border: 2px solid var(--success);' : ''}">
                <div class="probability-disease">${disease}</div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: 0%; animation-delay: ${index * 0.1}s;">
                    </div>
                </div>
                <div class="probability-percent">${probability.toFixed(2)}%</div>
            </div>
        `;
    });
    
    analyticsContent.innerHTML = html;
    analyticsContainer.style.display = 'block';
    analyticsEmpty.style.display = 'none';
    
    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.probability-fill').forEach((fill, index) => {
            const percent = parseFloat(fill.parentElement.parentElement.querySelector('.probability-percent').textContent);
            fill.style.width = percent + '%';
        });
    }, 100);
}

// ============================================================================
// PREDICTION HISTORY
// ============================================================================

function addToPredictionHistory(prediction) {
    // Add to history array
    appState.predictionHistory.unshift({
        disease: prediction.disease,
        confidence: prediction.confidence,
        timestamp: prediction.timestamp,
        image: prediction.image
    });
    
    // Keep only last 10
    if (appState.predictionHistory.length > 10) {
        appState.predictionHistory.pop();
    }
    
    // Save to localStorage
    savePredictionHistory();
    
    console.log('[v0] Added to history. Total:', appState.predictionHistory.length);
}

function loadPredictionHistory() {
    try {
        const saved = localStorage.getItem('predictionHistory');
        if (saved) {
            appState.predictionHistory = JSON.parse(saved);
            console.log('[v0] Loaded', appState.predictionHistory.length, 'predictions from history');
        }
    } catch (err) {
        console.error('[v0] Error loading history:', err);
        appState.predictionHistory = [];
    }
}

function savePredictionHistory() {
    try {
        localStorage.setItem('predictionHistory', JSON.stringify(appState.predictionHistory));
    } catch (err) {
        console.error('[v0] Error saving history:', err);
    }
}

function updateHistoryDisplay() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const sortSelect = document.getElementById('sortSelect').value;
    const historyBody = document.getElementById('historyBody');
    const historyEmpty = document.getElementById('historyEmpty');
    
    let filtered = [...appState.predictionHistory];
    
    // Filter by disease name
    if (searchInput) {
        filtered = filtered.filter(item => 
            item.disease.toLowerCase().includes(searchInput)
        );
    }
    
    // Sort
    if (sortSelect === 'oldest') {
        filtered.reverse();
    } else if (sortSelect === 'confidence') {
        filtered.sort((a, b) => b.confidence - a.confidence);
    }
    
    // Display
    if (filtered.length === 0) {
        historyEmpty.style.display = 'block';
        historyBody.innerHTML = '';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    let html = '';
    filtered.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.disease}</td>
                <td>${item.confidence.toFixed(2)}%</td>
                <td>${item.timestamp}</td>
            </tr>
        `;
    });
    
    historyBody.innerHTML = html;
}

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

async function checkSystemHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        console.log('[v0] System health:', data);
        
        // Update status indicators
        const modelStatus = data.model_loaded ? '🟢' : '🔴';
        const serverStatus = data.status === 'ready' ? '🟢' : '🔴';
        const cameraStatus = appState.supportsCamera ? '🟢' : '🟡';
        const aiStatus = data.model_loaded && data.status === 'ready' ? '🟢' : '🟡';
        
        document.getElementById('statusModel').textContent = modelStatus;
        document.getElementById('statusModelText').textContent = data.model_loaded ? 'Model Loaded' : 'Model Error';
        
        document.getElementById('statusServer').textContent = serverStatus;
        document.getElementById('statusServerText').textContent = data.status === 'ready' ? 'Server Online' : 'Server Error';
        
        document.getElementById('statusCamera').textContent = cameraStatus;
        document.getElementById('statusCameraText').textContent = appState.supportsCamera ? 'Camera Ready' : 'Camera N/A';
        
        document.getElementById('statusAI').textContent = aiStatus;
        document.getElementById('statusAIText').textContent = data.model_loaded && data.status === 'ready' ? 'AI Ready' : 'AI Loading';
        
    } catch (err) {
        console.error('[v0] Health check error:', err);
        
        // Show error status
        document.getElementById('statusServer').textContent = '🔴';
        document.getElementById('statusServerText').textContent = 'Connection Error';
    }
}

function updateCameraStatus(active) {
    const indicator = document.getElementById('statusCamera');
    const text = document.getElementById('statusCameraText');
    
    if (active) {
        indicator.textContent = '🟢';
        if (appState.cameraFacingMode === 'environment') {
            text.textContent = 'Rear Camera Active';
        } else {
            text.textContent = 'Front Camera Active';
        }
    } else {
        indicator.textContent = appState.supportsCamera ? '🟡' : '🔴';
        text.textContent = appState.supportsCamera ? 'Camera Ready' : 'Camera N/A';
    }
}

// ============================================================================
// UI UTILITIES
// ============================================================================

function showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 4000);
}

function showLoadingModal(show) {
    const modal = document.getElementById('loadingModal');
    modal.style.display = show ? 'flex' : 'none';
}

function scrollToDetection() {
    const detection = document.getElementById('detection');
    if (detection) {
        detection.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateActiveNavLink() {
    const sections = ['home', 'detection', 'history', 'status'];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const link = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (section && link) {
            const rect = section.getBoundingClientRect();
            
            // Check if section is in viewport
            if (rect.top <= 200 && rect.bottom >= 200) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        }
    });
}

// ============================================================================
// EXPORT FOR EXTERNAL USE
// ============================================================================

// ============================================================================
// REFRESH & RESET FUNCTIONS
// ============================================================================

function resetScanner() {
    console.log('[v0] Resetting scanner...');
    
    // Clear results
    const resultContainer = document.getElementById('resultContainer');
    const emptyState = document.getElementById('emptyState');
    const analyticsContainer = document.getElementById('analyticsContainer');
    const analyticsEmpty = document.getElementById('analyticsEmpty');
    
    resultContainer.style.display = 'none';
    emptyState.style.display = 'block';
    analyticsContainer.style.display = 'none';
    analyticsEmpty.style.display = 'block';
    
    // Reset prediction
    appState.currentPrediction = null;
    
    showStatusMessage('Scanner reset. Ready for new scan!', 'success');
}

function startNewScan() {
    console.log('[v0] Starting new scan...');
    
    // Reset preview and results
    resetPreview();
    resetScanner();
    
    // Clear status
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.style.display = 'none';
    
    // Stop camera if active
    if (appState.cameraActive) {
        stopCamera();
    }
    
    // Scroll to upload zone
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.scrollIntoView({ behavior: 'smooth' });
    }
    
    showStatusMessage('Ready for new scan. Upload an image or use camera!', 'info');
}

function stopCamera() {
    if (appState.currentCameraStream) {
        appState.currentCameraStream.getTracks().forEach(track => track.stop());
        appState.currentCameraStream = null;
    }
    
    appState.cameraActive = false;
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('cameraBtn').textContent = '📷 Start Camera';
    document.getElementById('cameraBtn').style.background = '';
    
    updateCameraStatus(false);
}

window.toggleCamera = toggleCamera;
window.capturePhoto = capturePhoto;
window.switchCamera = switchCamera;
window.stopCamera = stopCamera;
window.scrollToDetection = scrollToDetection;
window.resetScanner = resetScanner;
window.startNewScan = startNewScan;

console.log('[v0] JavaScript application loaded and ready');
