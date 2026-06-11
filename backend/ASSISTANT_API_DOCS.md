# AI Environmental Assistant API Documentation

## Base URL
```
http://localhost:5000/api/v1/assistant
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Chat with Assistant
**POST** `/chat`

Interactive conversation with the AI environmental assistant.

**Request Body:**
```json
{
  "message": "How can I reduce my carbon footprint?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Tell me about renewable energy"
    },
    {
      "role": "assistant",
      "content": "Renewable energy comes from natural sources..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Here are effective ways to reduce your carbon footprint...",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "query": "How can I reduce my carbon footprint?"
  }
}
```

---

### 2. Get Advice by Category
**GET** `/advice/:category`

Get expert advice on specific environmental topics.

**Categories:**
- `carbon` - Carbon reduction advice
- `pollution` - Pollution awareness and mitigation
- `sustainability` - Sustainable lifestyle changes
- `waste` - Waste reduction and recycling
- `energy` - Energy saving methods
- `water` - Water conservation techniques

**Example Request:**
```
GET /api/v1/assistant/advice/carbon
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "carbon",
    "advice": "Here are 5 practical tips to reduce your carbon footprint:\n1. Switch to renewable energy...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Analyze Carbon Footprint
**POST** `/carbon-analysis`

Get detailed analysis and recommendations for carbon footprint data.

**Request Body:**
```json
{
  "activities": {
    "transport": {
      "carMiles": 500,
      "flights": 2,
      "publicTransport": true
    },
    "energy": {
      "electricityKwh": 300,
      "gasTherm": 50,
      "renewablePercent": 20
    },
    "food": {
      "meatMealsPerWeek": 10,
      "localFoodPercent": 30
    },
    "waste": {
      "recyclingPercent": 60,
      "compostingActive": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Total estimated CO2 emissions: 2.5 tons/month\n\nBreakdown:\n- Transport: 1.2 tons (48%)\n- Energy: 0.8 tons (32%)...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Get Pollution Insights
**POST** `/pollution-insights`

Receive health and safety insights based on pollution data.

**Request Body:**
```json
{
  "pollutionData": {
    "location": "Delhi",
    "aqi": 185,
    "pm25": 95,
    "pm10": 150,
    "no2": 45,
    "o3": 30,
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": "Health Impact Assessment:\nThe AQI of 185 indicates UNHEALTHY air quality...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Get Quick Tips
**GET** `/quick-tips`

Get quick environmental tips with impact ratings.

**Response:**
```json
{
  "success": true,
  "data": {
    "tips": [
      {
        "category": "Energy",
        "tip": "Switch to LED bulbs to reduce energy consumption by up to 75%",
        "impact": "high"
      },
      {
        "category": "Transport",
        "tip": "Use public transport or carpool to cut carbon emissions significantly",
        "impact": "high"
      }
    ],
    "count": 5
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Message is required",
  "errors": ["Message cannot be empty"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized: invalid token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to get response from environmental assistant"
}
```

---

## Rate Limits
- 100 requests per hour per user
- Maximum message length: 1000 characters
- Conversation history limited to last 10 messages

---

## Usage Examples

### cURL Example
```bash
curl -X POST http://localhost:5000/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What are the best ways to save water at home?"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('http://localhost:5000/api/v1/assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'How can I reduce plastic waste?',
    conversationHistory: []
  })
});

const data = await response.json();
console.log(data.data.response);
```

---

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install @google/generative-ai
   ```

2. **Configure environment variables:**
   Add to `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Get Gemini API Key:**
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add it to your `.env` file

4. **Start the server:**
   ```bash
   npm run dev
   ```

---

## Features

✅ Environmental question answering  
✅ Sustainability suggestions  
✅ Carbon reduction advice  
✅ Pollution awareness insights  
✅ Conversation history support  
✅ Category-specific advice  
✅ Carbon footprint analysis  
✅ Quick actionable tips  
✅ Secure API key usage  
✅ Comprehensive error handling  

---

## Notes

- The AI assistant uses Google's Gemini 1.5 Flash model
- Responses are optimized for conciseness (max 300 words)
- All conversations require authentication
- Conversation history is optional but improves context
- The system prompt emphasizes practical, actionable advice
