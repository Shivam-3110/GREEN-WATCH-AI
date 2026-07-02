# AQI Data Not Showing - Troubleshooting Guide

## Quick Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] OpenWeather API key added to `backend/.env`
- [ ] Backend restarted after adding API key
- [ ] Browser console checked for errors
- [ ] Network tab checked for API calls

## Step-by-Step Debugging

### Step 1: Check Browser Console for Errors
1. Open browser (Chrome/Firefox)
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for red error messages
5. Copy the error message

**What to look for:**
- `OPENWEATHER_API_KEY is not defined` - API key not in .env
- `Failed to fetch AQI data` - Backend API error
- `Cannot read properties of null` - Location not found
- CORS errors - Backend/Frontend communication issue

### Step 2: Check Backend Logs
1. Look at backend terminal output
2. You should see:
   ```
   API server running on port 5000
   ```
3. When you load dashboard, check for logs like:
   ```
   Error fetching AQI data: Invalid API key
   ```

### Step 3: Test API Directly with cURL
Stop at frontend, test backend directly:

**Test current AQI endpoint:**
```bash
curl "http://localhost:5000/api/v1/air-quality/current?lat=28.7041&lon=77.1025"
```

**Expected response if working:**
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

**If you get error:**
```json
{
  "success": false,
  "message": "Failed to fetch AQI data"
}
```

Means OpenWeather API key issue. See troubleshooting below.

### Step 4: Check Network Requests
1. Open DevTools → **Network** tab
2. Reload the Dashboard page
3. Look for requests to:
   - `/api/v1/air-quality/current?lat=...&lon=...`
   - `/api/v1/air-quality/forecast?lat=...&lon=...`

**If you see the requests:**
- Green status (200) = Success, check response body
- Red status (500, 404) = Backend error

**If you DON'T see the requests:**
- Component might not be rendering
- Check if there are JavaScript errors

### Step 5: Check Location Detection
Open browser console and run:
```javascript
// Manually test location detection
import { getLocationCoordinates } from './src/utils/location'
const loc = await getLocationCoordinates()
console.log(loc)
```

You should see:
```
{
  lat: 28.7041,
  lon: 77.1025,
  source: "browser" | "default" | "timeout"
}
```

## Common Issues & Solutions

### Issue 1: "Invalid API key" Error
**Problem:** OpenWeather API key is wrong or not set

**Solution:**
1. Check `backend/.env` has the key:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```
2. Verify key is correct from https://openweathermap.org
3. **Restart backend** after changing .env
4. Test with cURL again

### Issue 2: "Latitude and longitude required" Error
**Problem:** Location not being passed from frontend

**Solution:**
1. Check location detection works
2. Open browser console, look for:
   ```
   Location: lat=28.7041, lon=77.1025 (source: browser)
   ```
3. If not showing, location detection failed
4. Browser geolocation might be denied:
   - Chrome: Settings → Privacy → Site Settings → Location
   - Firefox: Preferences → Privacy → Permissions → Location

### Issue 3: "No AQI data available" Error
**Problem:** OpenWeather returns empty data

**Solutions:**
- Coordinates might be invalid (check if lat/lon are correct)
- OpenWeather might be having issues
- Try different coordinates:
  ```
  NYC: lat=40.7128, lon=-74.0060
  London: lat=51.5074, lon=-0.1278
  Tokyo: lat=35.6762, lon=139.6503
  ```

### Issue 4: CORS Error or Network Issue
**Problem:** Frontend can't reach backend

**Solution:**
1. Verify backend running: `http://localhost:5000/api/v1/status`
2. Should return:
   ```json
   { "success": true, "message": "API v1 online" }
   ```
3. If not accessible:
   - Backend not running
   - Wrong port (should be 5000)
   - Firewall blocking

### Issue 5: Loading Never Completes (Stuck on "Loading AQI data...")
**Problem:** Request hung or timing out

**Solutions:**
1. Check Network tab - is request still pending?
2. Check backend logs - is it receiving the request?
3. API key might be invalid (slow failure)
4. Restart both frontend and backend

## Detailed Console Logging

The dashboard now logs detailed info. In browser console, look for:

```
Fetching location...
Location: { lat: 28.7041, lon: 77.1025, source: 'browser' }
Fetching current AQI...
Current AQI response: { success: true, data: {...} }
Fetching forecast...
Forecast response: { success: true, data: [...] }
AQI data set successfully
Forecast data set successfully
```

**If you see errors:**
```
Error fetching AQI data: Invalid API key
```

## Reset & Restart

If nothing works, completely reset:

1. **Stop backend:**
   - Press Ctrl+C in backend terminal

2. **Stop frontend:**
   - Press Ctrl+C in frontend terminal

3. **Clear environment:**
   - Delete `node_modules` in backend (optional)
   - Run `npm install` (optional)

4. **Verify .env:**
   ```bash
   cat backend/.env
   # Should show:
   # OPENWEATHER_API_KEY=your_api_key_here
   ```

5. **Start backend:**
   ```bash
   cd backend
   npm start
   # Wait for "API server running on port 5000"
   ```

6. **Start frontend (new terminal):**
   ```bash
   npm run dev
   # Wait for "Local: http://localhost:5173"
   ```

7. **Load dashboard and check console**

## Testing with Different Locations

To test if API works with valid data, try these coordinates:

```javascript
// In browser console
fetch('/api/v1/air-quality/current?lat=40.7128&lon=-74.0060')
  .then(r => r.json())
  .then(d => console.log(d))

// NYC should have data
```

## Still Not Working?

1. **Copy exact error message** from console
2. **Check network response** - right-click request → "Response" tab
3. **Verify API key** at https://openweathermap.org/api
4. **Try with test coordinates** (NYC, London, Tokyo)
5. **Check backend logs** for error messages

## Getting Help

When asking for help, provide:
1. Error message from console (exact text)
2. Response from `http://localhost:5000/api/v1/status`
3. Output of `curl` test command
4. Screenshot of Network tab
5. Contents of `backend/.env` (without API key)
