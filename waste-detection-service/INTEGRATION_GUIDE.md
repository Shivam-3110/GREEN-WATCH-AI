# Waste Detection API Integration Guide

## 🔗 Connecting to React Frontend

### Base Configuration

Add to your React app's environment or config:

```javascript
// src/config/api.js
export const WASTE_DETECTION_API = {
  baseURL: 'http://localhost:8000',
  endpoints: {
    detect: '/api/v1/waste-detection/detect',
    batchDetect: '/api/v1/waste-detection/batch-detect',
    wasteTypes: '/api/v1/waste-detection/supported-waste-types',
    modelInfo: '/api/v1/waste-detection/model-info'
  }
};
```

### Service Implementation

```javascript
// src/services/wasteDetectionService.js
import axios from 'axios';
import { WASTE_DETECTION_API } from '../config/api';

const wasteDetectionAPI = axios.create({
  baseURL: WASTE_DETECTION_API.baseURL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const detectWaste = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await wasteDetectionAPI.post(
      WASTE_DETECTION_API.endpoints.detect,
      formData
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to detect waste');
  }
};

export const batchDetectWaste = async (imageFiles) => {
  try {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('files', file);
    });

    const response = await wasteDetectionAPI.post(
      WASTE_DETECTION_API.endpoints.batchDetect,
      formData
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to detect waste');
  }
};

export const getSupportedWasteTypes = async () => {
  try {
    const response = await wasteDetectionAPI.get(
      WASTE_DETECTION_API.endpoints.wasteTypes
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch waste types');
  }
};

export const getModelInfo = async () => {
  try {
    const response = await wasteDetectionAPI.get(
      WASTE_DETECTION_API.endpoints.modelInfo
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch model info');
  }
};
```

### React Component Example

```javascript
// src/components/WasteDetector.jsx
import { useState } from 'react';
import { detectWaste } from '../services/wasteDetectionService';

export default function WasteDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await detectWaste(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="waste-detector">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />
      
      <button onClick={handleDetect} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect Waste'}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h3>Detection Results</h3>
          <p>Primary Waste: {result.primary_waste_type}</p>
          <p>Confidence: {(result.overall_confidence * 100).toFixed(1)}%</p>
          
          <h4>Detected Items:</h4>
          {result.detected_waste.map((waste, idx) => (
            <div key={idx}>
              <p>{waste.waste_type} - {(waste.confidence * 100).toFixed(1)}%</p>
              <p>Recyclable: {waste.recyclable ? 'Yes' : 'No'}</p>
              <p>{waste.disposal_method}</p>
            </div>
          ))}

          <h4>Environmental Impact:</h4>
          <p>Severity: {result.environmental_impact.severity}</p>
          <p>Decomposition: {result.environmental_impact.decomposition_time}</p>
          
          <h4>Recommendations:</h4>
          <ul>
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### TypeScript Types (Optional)

```typescript
// src/types/waste-detection.ts
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedWaste {
  waste_type: 'plastic' | 'metal' | 'organic' | 'e-waste';
  confidence: number;
  recyclable: boolean;
  disposal_method: string;
}

export interface DetectedObject {
  class_name: string;
  confidence: number;
  bounding_box: BoundingBox;
}

export interface EnvironmentalImpact {
  severity: 'Low' | 'Medium' | 'High';
  decomposition_time: string;
  carbon_footprint_kg: number;
  recyclable_percentage: number;
}

export interface WasteAnalysisResponse {
  success: boolean;
  filename: string;
  detected_waste: DetectedWaste[];
  detected_objects: DetectedObject[];
  primary_waste_type: string;
  overall_confidence: number;
  environmental_impact: EnvironmentalImpact;
  recommendations: string[];
  processing_time_ms: number;
  timestamp: string;
}
```

### Using with React Hook

```javascript
// src/hooks/useWasteDetection.js
import { useState } from 'react';
import { detectWaste } from '../services/wasteDetectionService';

export const useWasteDetection = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const detect = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await detectWaste(file);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { detect, loading, result, error, reset };
};
```

### Image Preview Component

```javascript
// src/components/ImageUploadPreview.jsx
import { useState } from 'react';
import { useWasteDetection } from '../hooks/useWasteDetection';

export default function ImageUploadPreview() {
  const [preview, setPreview] = useState(null);
  const { detect, loading, result, error } = useWasteDetection();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Detect waste
    await detect(file);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={loading}
      />

      {preview && (
        <img src={preview} alt="Preview" style={{ maxWidth: '400px' }} />
      )}

      {loading && <p>Analyzing image...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div>
          <h3>✅ Analysis Complete</h3>
          <p>Type: {result.primary_waste_type}</p>
          <p>Confidence: {(result.overall_confidence * 100).toFixed(0)}%</p>
        </div>
      )}
    </div>
  );
}
```

## 🎨 UI Component Ideas

1. **Upload Zone**: Drag-and-drop file upload
2. **Image Preview**: Show uploaded image with bounding boxes
3. **Results Card**: Display waste type with confidence meter
4. **Impact Metrics**: Visual representation of environmental impact
5. **Recommendations List**: Action items for proper disposal

## 🔧 CORS Configuration

The FastAPI service already has CORS enabled for all origins in development:

```python
# In production, update main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚀 Running Both Services

1. **Terminal 1 - FastAPI (Port 8000)**:
```bash
cd waste-detection-service
python server.py
```

2. **Terminal 2 - Node.js Backend (Port 5000)**:
```bash
cd backend
npm run dev
```

3. **Terminal 3 - React Frontend (Port 3000/5173)**:
```bash
npm run dev
```

## 📝 Error Handling Best Practices

```javascript
try {
  const result = await detectWaste(file);
  // Handle success
} catch (error) {
  if (error.response?.status === 413) {
    // File too large
    showError('Image is too large. Maximum size is 10MB');
  } else if (error.response?.status === 400) {
    // Invalid file
    showError('Invalid image file. Please upload JPG, PNG, or WEBP');
  } else {
    // General error
    showError('Failed to analyze image. Please try again.');
  }
}
```

## 🎯 Next Steps

1. Create React page for waste detection
2. Implement image upload with preview
3. Display results with charts
4. Add loading states and animations
5. Integrate with your dashboard

Ready to use! 🚀
