# Dynamic Location-Based AQI Integration

## Overview
Updated the AQI system to automatically fetch user location and load air quality data for their current position. No need to hardcode coordinates in the backend.

## How It Works

### Location Detection Methods (In Order)
1. **Browser Geolocation API** (Preferred)
   - Requests user permission
   - Gets precise GPS coordinates
   - Most accurate method
   - User must allow location access

2. **IP Geolocation** (Optional)
   - Fallback if browser geolocation fails
   - Uses ipapi.co service
   - City-level accuracy
   - No user permission needed

3. **Default Location** (Fallback)
   - Falls back to Delhi (28.7041, 77.1025)
   - Used if both above methods fail
   - Ensures app never breaks

### Request Flow
```
User Opens Dashboard/AirQuality
       ↓
getLocationCoordinates() called
       ↓
Browser Geolocation API
       ↓ (if granted)
Pass lat/lon to API endpoint
       ↓ (if denied or timeout)
Default Fallback Coordinates
       ↓
Fetch AQI data with coordinates
```

## API Endpoints

### Request with Custom Location
```bash
GET /api/v1/air-quality/current?lat=40.7128&lon=-74.0060
GET /api/v1/air-quality/forecast?lat=40.7128&lon=-74.0060
```

### Request with Default Location (from .env)
```bash
GET /api/v1/air-quality/current
GET /api/v1/air-quality/forecast
```

The backend automatically uses `CITY_LAT` and `CITY_LON` from `.env` if no params provided.

## Frontend Usage

### In React Components
```jsx
import { getLocationCoordinates } from '../utils/location'

const location = await getLocationCoordinates()
// Returns: { lat: 28.7041, lon: 77.1025, source: 'browser' }

// Pass to API
axios.get('/api/v1/air-quality/current', {
  params: { lat: location.lat, lon: location.lon }
})
```

### Location Source Indicators
- `source: 'browser'` - Browser geolocation (most accurate)
- `source: 'ip'` - IP-based geolocation
- `source: 'default'` - Fallback to env coordinates
- `source: 'timeout'` - Timeout triggered fallback

## User Permission Handling

### Browser Geolocation Permission
When user first loads the app:
1. Browser shows permission prompt: "Allow location access?"
2. If **Allowed**: Uses precise GPS coordinates
3. If **Denied**: Falls back to default coordinates
4. If **Not Responded**: Waits 5 seconds, then falls back

### Graceful Degradation
- ✅ Geolocation works → Use GPS coordinates
- ✅ Geolocation fails → Try IP geolocation
- ✅ IP geolocation fails → Use .env defaults
- ✅ All fail → App still works with default location

## Environment Variables

### Backend (.env)
```
OPENWEATHER_API_KEY=your_api_key
CITY_LAT=28.7041          # Fallback latitude (Delhi)
CITY_LON=77.1025          # Fallback longitude (Delhi)
```

**No need to change these anymore** - they're only used as fallback!

### Change Fallback Location (Optional)
Edit `backend/.env`:
```
CITY_LAT=51.5074    # London
CITY_LON=-0.1278    # London
```

## Files Changed

**Backend**:
- `backend/src/routes/airQuality.routes.js` - Added validation for lat/lon params

**Frontend**:
- `src/utils/location.js` - **NEW** Location detection service
- `src/pages/DashboardPage.jsx` - Now fetches location automatically
- `src/pages/AirQualityPage.jsx` - Now fetches location automatically

## Testing Location Detection

### Test Browser Geolocation
1. Open browser DevTools (F12)
2. Go to Sensors tab
3. Set Location: Manhattan New York
4. Reload page
5. Dashboard should show NYC air quality

### Test IP Geolocation
1. Use VPN to change IP address
2. Reload app
3. Should show data for VPN location

### Test Fallback
1. Disable geolocation in browser
2. Reload app
3. Should show Delhi data from .env

## Security & Privacy

- ✅ No location stored on server
- ✅ No tracking of user movement
- ✅ Location only used for real-time AQI lookup
- ✅ User can deny geolocation anytime
- ✅ HTTPS recommended for sensitive data

## Troubleshooting

### "Failed to load AQI data"
1. Check if backend is running
2. Verify OpenWeatherMap API key is valid
3. Check browser console for detailed error

### "Showing Delhi data but I'm in another city"
1. Browser geolocation was denied/disabled
2. IP geolocation service is unavailable
3. Using fallback from .env

To enable:
- Chrome: Settings → Privacy → Site Settings → Location
- Firefox: Preferences → Privacy → Permissions → Location

### API Key validation error
1. Ensure `OPENWEATHER_API_KEY` is in `backend/.env`
2. Restart backend server
3. Try fresh request

## Examples

### Dashboard Auto-Location
```jsx
// Automatically detects user location
// Fetches AQI for their current position
// Updates every 5 minutes
function DashboardPage() {
  useEffect(() => {
    const location = await getLocationCoordinates()
    // Now shows real-time AQI for user's location
  }, [])
}
```

### Manual Location Override (Optional)
To show data for specific location:
```jsx
// Instead of using getLocationCoordinates()
const location = { lat: 40.7128, lon: -74.0060 } // NYC

axios.get('/api/v1/air-quality/current', {
  params: { lat: location.lat, lon: location.lon }
})
```

## Next Steps (Optional Enhancements)

1. **Save User Location Preference**
   - Remember user's city selection
   - Show toggle to change location

2. **Multiple Location Comparison**
   - Compare AQI across cities
   - Show nearby locations

3. **Location History**
   - Track AQI trends for user's location
   - Monthly/yearly comparisons

4. **Alerts for Location**
   - Notify when AQI exceeds threshold in user's area
   - Location-specific recommendations
