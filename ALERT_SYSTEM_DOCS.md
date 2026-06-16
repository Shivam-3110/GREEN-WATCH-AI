# Environmental Alert System - Socket.io Implementation

## Overview
Realtime environmental alert system using Socket.io for instant notifications about AQI, heatwaves, floods, and other environmental hazards.

---

## Architecture

### Backend (Node.js + Socket.io)
```
backend/
├── src/
│   ├── sockets/
│   │   └── socketServer.js          # Socket.io server setup
│   ├── services/
│   │   └── environmentalAlert.service.js  # Alert generation logic
│   ├── controllers/
│   │   └── alerts.controller.js     # Alert API endpoints
│   └── routes/
│       └── alerts.routes.js         # Alert routes
```

### Frontend (React + Socket.io Client)
```
src/
├── services/
│   └── socketService.js             # Socket.io client wrapper
├── contexts/
│   └── NotificationContext.jsx      # Alert state management
├── components/
│   └── ui/
│       └── NotificationPopup.jsx    # Notification UI
└── pages/
    └── AlertTestPage.jsx            # Test/demo page
```

---

## Features

### ✅ Alert Types
1. **AQI Alerts** 🌬️
   - Good (0-50)
   - Moderate (51-100)
   - Unhealthy for Sensitive Groups (101-150)
   - Unhealthy (151-200)
   - Very Unhealthy (201-300)
   - Hazardous (301-500)

2. **Heatwave Alerts** 🌡️
   - Warning (35°C+)
   - Critical (40°C+)
   - Emergency (45°C+)

3. **Flood Alerts** 🌊
   - Moderate Risk
   - High Risk
   - Extreme Risk
   - Severe Risk

### ✅ Severity Levels
- **Info**: Blue - General information
- **Warning**: Yellow - Caution advised
- **Critical**: Orange - Immediate action needed
- **Emergency**: Red - Life-threatening situation

### ✅ Realtime Features
- Live Socket.io connection
- Instant alert delivery
- Auto-dismiss on expiry
- Connection status indicator
- Alert acknowledgment system

---

## Socket.io Events

### Client → Server

#### `alerts:subscribe`
Subscribe to location-based alerts
```javascript
socket.emit('alerts:subscribe', {
  userId: 'user123',
  location: 'Delhi'
});
```

#### `alerts:unsubscribe`
Unsubscribe from alerts
```javascript
socket.emit('alerts:unsubscribe', {
  userId: 'user123',
  location: 'Delhi'
});
```

#### `aqi:subscribe`
Subscribe to AQI updates for specific location
```javascript
socket.emit('aqi:subscribe', 'delhi_center');
```

#### `alert:acknowledge`
Acknowledge receipt of alert
```javascript
socket.emit('alert:acknowledge', 'alert_123456');
```

### Server → Client

#### `environmental:alert`
Receive single alert
```javascript
socket.on('environmental:alert', (alert) => {
  console.log('Alert received:', alert);
});
```

#### `environmental:alerts:bulk`
Receive multiple alerts at once
```javascript
socket.on('environmental:alerts:bulk', (alerts) => {
  console.log('Bulk alerts:', alerts);
});
```

---

## API Endpoints

### Base URL
`http://localhost:5000/api/v1/alerts`

### 1. Trigger AQI Alert
**POST** `/aqi`

```json
{
  "location": "Delhi",
  "aqi": 250,
  "pollutant": "PM2.5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AQI alert triggered successfully",
  "data": {
    "alert": {
      "id": "alert_1234567890_abc",
      "type": "aqi",
      "severity": "critical",
      "title": "Very Unhealthy Air Quality",
      "message": "Air Quality Index is 250 in Delhi",
      "details": {
        "location": "Delhi",
        "aqi": 250,
        "category": "Very Unhealthy",
        "pollutant": "PM2.5"
      },
      "recommendations": [
        "🏠 Limit outdoor activities",
        "😷 Wear masks when going outside",
        "👶 Keep children and sensitive groups indoors"
      ],
      "timestamp": "2024-01-15T10:30:00.000Z",
      "expiresAt": "2024-01-15T16:30:00.000Z"
    },
    "emitted": true
  }
}
```

### 2. Trigger Heatwave Alert
**POST** `/heatwave`

```json
{
  "location": "Mumbai",
  "temperature": 42,
  "duration": "Next 48 hours"
}
```

### 3. Trigger Flood Alert
**POST** `/flood`

```json
{
  "location": "Chennai",
  "riskLevel": "high",
  "rainfall": "150mm in 24 hours"
}
```

### 4. Test Alert (Demo)
**POST** `/test`

```json
{
  "type": "aqi",  // or "heatwave", "flood", "random"
  "location": "Delhi"
}
```

### 5. Get Alert Types
**GET** `/types`

Returns available alert types and severity levels.

---

## Frontend Implementation

### 1. Socket Service Setup

```javascript
import socketService from './services/socketService';

// Connect on app load
socketService.connect();

// Subscribe to alerts
socketService.subscribeToAlerts('user123', 'Delhi');

// Listen for alerts
socketService.onAlert((alert) => {
  console.log('Alert received:', alert);
});
```

### 2. Using Notification Context

```javascript
import { useNotifications } from './contexts/NotificationContext';

function MyComponent() {
  const { alerts, removeAlert, clearAllAlerts, isConnected } = useNotifications();

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Active Alerts: {alerts.length}</p>
      <button onClick={clearAllAlerts}>Clear All</button>
    </div>
  );
}
```

### 3. Manual Alert Trigger

```javascript
import axios from 'axios';

const triggerAlert = async () => {
  await axios.post('http://localhost:5000/api/v1/alerts/test', {
    type: 'aqi',
    location: 'Delhi'
  });
};
```

---

## Alert Object Structure

```typescript
interface Alert {
  id: string;
  type: 'aqi' | 'heatwave' | 'flood' | 'storm' | 'wildfire';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  details: {
    location: string;
    // Type-specific fields
    aqi?: number;
    category?: string;
    temperature?: number;
    riskLevel?: string;
    // ... more fields
  };
  recommendations: string[];
  timestamp: string;
  expiresAt: string;
}
```

---

## Testing

### Start Backend
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

### Start Frontend
```bash
npm run dev
```
Client runs on `http://localhost:5173`

### Test Alert System
1. Navigate to `/alerts` page
2. Ensure "Connected" status shows
3. Click any alert button
4. Check top-right corner for notification popup
5. Alert should appear with animation
6. Click X to dismiss or wait for auto-dismiss

---

## Configuration

### Backend (.env)
```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (socketService.js)
```javascript
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: true,
});
```

---

## Alert Expiry Times

| Alert Type | Expiry Time |
|------------|-------------|
| AQI | 6 hours |
| Heatwave | 48 hours |
| Flood | 24 hours |
| Storm | 12 hours |
| Wildfire | 24 hours |

---

## Recommendations System

Each alert includes context-aware recommendations:

### AQI (Hazardous)
- 🚨 Stay indoors with windows closed
- 😷 Wear N95 masks if you must go outside
- 🏥 Seek medical attention if experiencing symptoms

### Heatwave (Emergency)
- 🏠 Stay indoors in air-conditioned spaces
- 💧 Drink water every 15-20 minutes
- ❌ Avoid all outdoor activities

### Flood (Severe)
- 🚨 Evacuate if instructed by authorities
- 📱 Keep emergency contacts handy
- 🎒 Prepare emergency kit

---

## Production Deployment

### Socket.io Scaling
For multiple servers, use Redis adapter:

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### CORS Configuration
Update for production domain:

```javascript
io = new Server(httpServer, {
  cors: {
    origin: 'https://yourdomain.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

---

## Future Enhancements

- [ ] Push notifications (Web Push API)
- [ ] Email/SMS alerts
- [ ] Alert history and analytics
- [ ] User-specific alert preferences
- [ ] Geolocation-based auto-subscription
- [ ] Alert severity customization
- [ ] Multi-language support
- [ ] Voice alerts for critical situations

---

## Troubleshooting

### Connection Issues
1. Check if backend is running on port 5000
2. Verify CORS settings
3. Check browser console for errors
4. Ensure Socket.io client version matches server

### Alerts Not Appearing
1. Verify socket connection (check connection indicator)
2. Check if NotificationProvider wraps App
3. Verify alert is being emitted from backend
4. Check browser console for errors

### Performance Issues
1. Limit max alerts shown (currently 5)
2. Implement alert pagination
3. Use Redis for scaling
4. Optimize alert payload size

---

Built with ❤️ for EcoSphere AI
