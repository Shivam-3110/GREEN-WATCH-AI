# 🌍 EcoSphere Waste Detection API

AI-powered microservice for waste detection and classification using FastAPI.

## 🚀 Features

- ✅ **Image Upload Endpoint** - Upload images for waste detection
- ✅ **AI-Powered Detection** - Mock AI model (ready for TensorFlow/YOLO upgrade)
- ✅ **Multi-Class Classification** - Detects 4 waste types:
  - Plastic (bottles, bags, containers)
  - Metal (cans, foil, scrap)
  - Organic (food waste, peels)
  - E-waste (electronics, batteries)
- ✅ **Batch Processing** - Upload multiple images at once
- ✅ **JSON Response** - Clean, structured API responses
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Swagger UI** - Interactive API documentation
- ✅ **CORS Enabled** - Frontend integration ready

## 📁 Project Structure

```
waste-detection-service/
├── app/
│   ├── api/
│   │   └── detection.py          # API endpoints
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   ├── services/
│   │   └── detection_service.py  # Mock AI model
│   ├── utils/
│   │   └── file_utils.py         # File validation
│   └── main.py                   # FastAPI app
├── uploads/                      # Image storage
├── .env                         # Environment config
├── requirements.txt             # Dependencies
├── server.py                    # Entry point
└── README.md                    # This file
```

## 🛠️ Installation

### Prerequisites
- Python 3.9+
- pip

### Setup

1. **Navigate to service directory**
```bash
cd waste-detection-service
```

2. **Create virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
# .env file is already created with default values
# Modify if needed
```

## 🚀 Running the Service

### Development Mode
```bash
python server.py
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Service will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### 1. Detect Waste (Single Image)
**POST** `/api/v1/waste-detection/detect`

Upload an image to detect waste.

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/waste-detection/detect" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@waste_image.jpg"
```

**Response:**
```json
{
  "success": true,
  "filename": "waste_image.jpg",
  "detected_waste": [
    {
      "waste_type": "plastic",
      "confidence": 0.92,
      "recyclable": true,
      "disposal_method": "Blue recycling bin - Clean and dry before disposal"
    }
  ],
  "detected_objects": [
    {
      "class_name": "plastic_bottle",
      "confidence": 0.92,
      "bounding_box": {
        "x": 120,
        "y": 80,
        "width": 200,
        "height": 350
      }
    }
  ],
  "primary_waste_type": "plastic",
  "overall_confidence": 0.92,
  "environmental_impact": {
    "severity": "High",
    "decomposition_time": "450 years",
    "carbon_footprint_kg": 2.3,
    "recyclable_percentage": 100.0
  },
  "recommendations": [
    "Clean and dry plastic items before recycling",
    "Remove labels and caps when possible",
    "Consider reusable alternatives to reduce plastic waste"
  ],
  "processing_time_ms": 45.23,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Batch Detect Waste
**POST** `/api/v1/waste-detection/batch-detect`

Upload multiple images (max 10).

### 3. Get Supported Waste Types
**GET** `/api/v1/waste-detection/supported-waste-types`

Get list of supported waste categories.

### 4. Get Model Info
**GET** `/api/v1/waste-detection/model-info`

Get information about the detection model.

### 5. Health Check
**GET** `/health`

Check service health status.

## 🧪 Testing

### Using curl
```bash
# Single image detection
curl -X POST "http://localhost:8000/api/v1/waste-detection/detect" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_image.jpg"

# Get supported types
curl http://localhost:8000/api/v1/waste-detection/supported-waste-types
```

### Using Python
```python
import requests

# Upload image
url = "http://localhost:8000/api/v1/waste-detection/detect"
files = {"file": open("waste_image.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

### Using Swagger UI
Visit http://localhost:8000/docs for interactive testing.

## 🔄 Upgrading to Real AI Model

The service is designed for easy ML model integration. To upgrade:

1. **Install ML dependencies**
```bash
pip install tensorflow  # or
pip install torch torchvision  # or
pip install ultralytics  # for YOLO
```

2. **Replace detection_service.py**
   - Keep the same interface (predict method)
   - Load your trained model
   - Return same response structure

3. **Add model files**
```
waste-detection-service/
├── models/
│   ├── waste_detection.h5  # TensorFlow
│   └── yolov8_waste.pt     # YOLO
```

4. **Update service code**
```python
# Example TensorFlow integration
import tensorflow as tf

class WasteDetectionModel:
    def __init__(self):
        self.model = tf.keras.models.load_model('models/waste_detection.h5')
    
    def predict(self, image_bytes):
        # Your ML inference code here
        pass
```

## 🔧 Configuration

**Environment Variables** (`.env`):
```env
PORT=8000
HOST=0.0.0.0
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp
UPLOAD_DIR=uploads
MODEL_CONFIDENCE_THRESHOLD=0.75
```

## 📊 Response Schema

### WasteAnalysisResponse
```typescript
{
  success: boolean
  filename: string
  detected_waste: Array<{
    waste_type: "plastic" | "metal" | "organic" | "e-waste"
    confidence: number  // 0-1
    recyclable: boolean
    disposal_method: string
  }>
  detected_objects: Array<{
    class_name: string
    confidence: number
    bounding_box: { x, y, width, height }
  }>
  primary_waste_type: string
  overall_confidence: number
  environmental_impact: {
    severity: "Low" | "Medium" | "High"
    decomposition_time: string
    carbon_footprint_kg: number
    recyclable_percentage: number
  }
  recommendations: string[]
  processing_time_ms: number
  timestamp: string
}
```

## 🛡️ Error Handling

All errors return structured JSON:

```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid file)
- `413` - File Too Large
- `422` - Validation Error
- `500` - Internal Server Error

## 🔗 Integration with Frontend

### Axios Example
```javascript
import axios from 'axios';

const detectWaste = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    'http://localhost:8000/api/v1/waste-detection/detect',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data;
};
```

## 📝 Notes

- **Mock AI Model**: Currently uses a mock model for demonstration. Results are simulated but realistic.
- **Production Ready**: Architecture is production-ready. Just swap the model for real ML.
- **Scalable**: Can be deployed to cloud (AWS, GCP, Azure, Docker)
- **Independent**: Runs separately from Node.js backend

## 🚀 Deployment

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "server.py"]
```

### Cloud Deployment
- AWS Lambda / EC2
- Google Cloud Run
- Azure Functions
- Heroku

## 📞 Support

For issues or questions about the waste detection service, check:
- Swagger UI: http://localhost:8000/docs
- Service health: http://localhost:8000/health

## 🎯 Next Steps

1. ✅ Service is ready to run
2. Train/acquire a real ML model
3. Replace detection_service.py
4. Deploy to production
5. Integrate with frontend

---

Built with ❤️ for EcoSphere AI
