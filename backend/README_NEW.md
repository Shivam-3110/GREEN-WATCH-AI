# EcoSphere AI Backend

Environmental intelligence API with AI assistant powered by Google Gemini.

## Features

✅ **Authentication System** - JWT-based auth with bcrypt password hashing  
✅ **AI Environmental Assistant** - Powered by Google Gemini API  
✅ **Real-time Updates** - Socket.io integration for live data  
✅ **MongoDB Database** - Mongoose ODM with optimized schemas  
✅ **Secure API** - Helmet, CORS, input validation  
✅ **Error Handling** - Centralized error middleware  

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcryptjs
- **AI:** Google Generative AI (Gemini)
- **Real-time:** Socket.io
- **Security:** Helmet, CORS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/Green-WatchAI
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS/Linux
mongod

# Windows
net start MongoDB
```

### 5. Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (protected)
- `GET /api/v1/auth/profile` - Get user profile (protected)

### AI Assistant

- `POST /api/v1/assistant/chat` - Chat with AI assistant
- `GET /api/v1/assistant/advice/:category` - Get category advice
- `POST /api/v1/assistant/carbon-analysis` - Analyze carbon footprint
- `POST /api/v1/assistant/pollution-insights` - Get pollution insights
- `GET /api/v1/assistant/quick-tips` - Get quick environmental tips

### Health Check

- `GET /health` - Server health status
- `GET /api/v1/status` - API status
- `GET /api/v1/protected/ping` - Test protected route

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (Gemini service)
│   ├── sockets/         # Socket.io setup
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   └── app.js           # Express app configuration
├── .env                 # Environment variables
├── server.js            # Server entry point
└── package.json
```

## Database Models

- **User** - User accounts and profiles
- **PollutionData** - Air quality and pollution metrics
- **CarbonScore** - User carbon footprint tracking
- **Alert** - Environmental notifications
- **WasteDetection** - Waste identification records
- **Conversation** - AI assistant chat history
- **EcoChallenge** - Environmental challenges
- **EcoReport** - Generated reports

## AI Assistant Features

### Environmental Question Answering
Ask any environmental or sustainability question and get expert AI-powered answers.

### Sustainability Suggestions
Receive personalized recommendations for sustainable lifestyle changes.

### Carbon Reduction Advice
Get actionable tips to reduce your carbon footprint across transport, energy, food, and waste.

### Pollution Awareness
Understand air quality data with health impact assessments and safety recommendations.

## Testing the API

### Using cURL

```bash
# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Chat with AI (use token from login)
curl -X POST http://localhost:5000/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"How can I reduce my carbon footprint?"}'
```

### Using the Test Script

```bash
node test-assistant-api.js
```

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **API Key Protection** - Environment variable storage
- **CORS** - Configured for frontend origin
- **Helmet** - Security headers
- **Input Validation** - Request payload validation
- **Error Sanitization** - Safe error messages

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| NODE_ENV | Environment mode | No (default: development) |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_EXPIRES_IN | Token expiration time | No (default: 7d) |
| CLIENT_URL | Frontend URL for CORS | Yes |
| GEMINI_API_KEY | Google Gemini API key | Yes (for AI features) |

## Documentation

Detailed API documentation available in:
- [ASSISTANT_API_DOCS.md](./ASSISTANT_API_DOCS.md) - AI Assistant endpoints

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## License

ISC
