# EcoSphere AI Backend

## Run locally

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Core endpoints

- `GET /health`
- `GET /api/v1/status`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (Bearer token)