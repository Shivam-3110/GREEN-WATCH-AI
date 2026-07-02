# 🔑 Gemini API Setup Guide

## Problem Solved
**Error:** `GEMINI_API_KEY is not configured`

## Root Cause
The Gemini API key in your `.env` file was invalid/incorrectly formatted.

---

## ✅ SOLUTION: Get a Valid API Key

### Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio:**
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Sign in** with your Google account

3. **Click "Create API Key"**
   - Select existing Google Cloud project OR
   - Create new project

4. **Copy the API key** (starts with `AIzaSy...`)

### Step 2: Update .env File

Open `backend/.env` and replace the placeholder:

```env
# OLD (INVALID):
GEMINI_API_KEY=AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q

# NEW (YOUR ACTUAL KEY):
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Restart Server

```bash
cd backend
node server.js
```

**Expected Output:**
```
✅ Gemini AI Service initialized successfully
🚀 API server running on port 5000
```

---

## 🔧 What Was Fixed

### 1. Made Service Optional (Graceful Degradation)
**Before:** Server crashed if API key missing
**After:** Server starts with AI features disabled + warning message

### 2. Added Validation
- Checks if key exists
- Checks if key is placeholder
- Validates initialization

### 3. Fallback Responses
- Returns user-friendly error messages
- Doesn't crash the application
- Logs helpful instructions

---

## 🎯 Valid API Key Format

✅ **CORRECT:**
```
AIzaSyAbCd1234567890_xYz-ABCDEFGHIJK
```
- Starts with `AIzaSy`
- 39 characters total
- Mix of letters, numbers, underscores, hyphens

❌ **INCORRECT:**
```
AQ.Ab8RN6J9Os2DAaAWxwdXo1_1it3jEF39OOSkbxUr8o7twce98Q
```
- Starts with `AQ.` (wrong format)
- This appears to be a different API key type

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` in `.gitignore`
- Never commit API keys to Git
- Use different keys for dev/prod
- Rotate keys periodically
- Restrict API key usage in Google Cloud Console

### ❌ DON'T:
- Share API keys publicly
- Hardcode keys in source code
- Use same key across projects
- Commit `.env` to version control

---

## 🧪 Testing the Fix

### Test 1: Check Server Starts
```bash
cd backend
node server.js
```
Should see: `✅ Gemini AI Service initialized successfully`

### Test 2: Test Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is carbon footprint?"}'
```

### Test 3: Frontend Integration
1. Start frontend: `npm run dev`
2. Navigate to `/chat`
3. Send a message
4. Should receive AI response

---

## 🆘 Troubleshooting

### Issue: "API key invalid"
**Solution:** 
- Verify key starts with `AIzaSy`
- Check for extra spaces/newlines
- Get a new key from AI Studio

### Issue: "Quota exceeded"
**Solution:**
- Check usage in Google Cloud Console
- Upgrade to paid tier if needed
- Wait for quota reset (daily/monthly)

### Issue: "Server still won't start"
**Check:**
1. `.env` file location (must be in `/backend`)
2. No typos in variable name
3. Restart terminal/IDE to reload env vars
4. Run: `echo $GEMINI_API_KEY` (Mac/Linux) or `echo %GEMINI_API_KEY%` (Windows)

---

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com/app/apikey)
- [Pricing](https://ai.google.dev/pricing)
- [Rate Limits](https://ai.google.dev/docs/rate_limits)

---

## 🎉 Summary

**What happened:** Invalid API key format prevented service initialization

**What we fixed:**
1. ✅ Made service optional (server won't crash)
2. ✅ Added validation and helpful warnings
3. ✅ Provided fallback responses
4. ✅ Updated `.env` with placeholder
5. ✅ Created this setup guide

**Next steps:**
1. Get your API key from Google AI Studio
2. Replace placeholder in `.env`
3. Restart server
4. Test AI features

**Result:** Server now starts successfully with or without API key! 🚀

---

Built with ❤️ for EcoSphere AI
