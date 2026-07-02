# Real-Time Air Quality Integration

## Overview
Replaced dummy AQI data with real-time pollution monitoring from OpenWeatherMap API. Dashboard and Air Quality pages now display live air quality index, PM2.5/PM10, ozone, and other pollutant levels with 24-hour forecasts.

## Setup Instructions

### 1. Get OpenWeatherMap API Key
- Sign up at https://openweathermap.org/api
- Get the free "Air Pollution API" key
- This provides current AQI data and forecasts for any location

### 2. Update Environment Variables
Edit `backend/.env`:
```
OPENWEATHER_API_KEY=your_api_key_here
CITY_LAT=28.7041      # Default: Delhi latitude
CITY_LON=77.1025      # Default: Delhi longitude
```

Change coordinates to your location or leave defaults for Delhi.

### 3. Install Dependencies
Backend already has `axios` installed. No additional packages needed.

## API Endpoints

### Get Current AQI
```
GET /api/v1/air-quality/current?lat=28.7041&lon=77.1025
```

Response:
```json
{
  "success": true,
  "data": {
    "aqi": 72,
    "pm25": 28.5,
    "pm10": 61.2,
    "o3": 34.8,
    "no2": 45.2,
    "so2": 12.3,
    "co": 234.5,
    "status": "Moderate",
    "label": "Fair",
    "timestamp": "2024-01-20T14:30:00Z"
  }
}
```

### Get 24-Hour Forecast
```
GET /api/v1/air-quality/forecast?lat=28.7041&lon=77.1025
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "time": "14:00",
      "hour": 14,
      "aqi": 72,
      "pm25": 28.5,
      "pm10": 61.2
    },
    ...
  ]
}
```

## Frontend Integration

### DashboardPage
- Fetches current AQI on component mount
- Displays real-time metrics in metric cards
- Shows 24-hour AQI trend in pollution analytics chart
- Auto-refreshes every 5 minutes (300,000ms)

### AirQualityPage
- Full detailed air quality dashboard
- Current AQI status with color-coded severity
- Individual pollutant cards (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- 24-hour forecast charts
- PM2.5 and PM10 trend lines
- Health recommendations based on AQI level

## Data Update Frequency
- Real-time data: Updates every 5 minutes
- Forecast data: Updated with current data fetch
- No caching to ensure latest data

## AQI Scale Reference
| AQI Level | Status | Health Impact |
|-----------|--------|---------------|
| 0-50 | Good | No health impact |
| 51-100 | Moderate | Sensitive groups may experience symptoms |
| 101-150 | Poor | General population begins to experience effects |
| 151-200 | Very Poor | Widespread health effects |
| 200+ | Severe | Health alert, avoid outdoor activities |

## Error Handling
- If API fails, displays error message to user
- Graceful fallback with retry on auto-refresh
- Error logged to browser console for debugging

## File Changes
- **Backend**: `backend/src/services/airQuality.service.js` (new)
- **Backend**: `backend/src/routes/airQuality.routes.js` (new)
- **Backend**: `backend/src/routes/index.js` (updated)
- **Backend**: `backend/.env` (updated)
- **Frontend**: `src/pages/DashboardPage.jsx` (updated)
- **Frontend**: `src/pages/AirQualityPage.jsx` (completely replaced)

## Troubleshooting

### "Failed to fetch AQI data"
1. Verify `OPENWEATHER_API_KEY` is set in `.env`
2. Confirm latitude/longitude are valid
3. Check OpenWeatherMap API status

### No data displayed
1. Ensure backend is running on port 5000
2. Check browser console for API errors
3. Verify network tab shows successful API calls

### Incorrect location
Update `CITY_LAT` and `CITY_LON` in `.env`:
```
CITY_LAT=40.7128    # New York
CITY_LON=-74.0060   # New York
```

Then restart backend server.
