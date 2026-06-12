from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.api.detection import router as detection_router
from app.models.schemas import HealthResponse, ErrorResponse
import time

# Initialize FastAPI app
app = FastAPI(
    title="EcoSphere Waste Detection API",
    description="AI-powered waste detection and classification microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
    return response

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="Validation Error",
            detail=str(exc.errors())
        ).model_dump()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc)
        ).model_dump()
    )

# Health Check
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint"
)
async def health_check():
    """Check if the service is running."""
    return HealthResponse(
        status="healthy",
        service="Waste Detection Service",
        version="1.0.0"
    )

@app.get(
    "/",
    tags=["Root"],
    summary="Root endpoint"
)
async def root():
    """Root endpoint with API information."""
    return {
        "service": "EcoSphere Waste Detection API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(detection_router)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    print("🚀 Waste Detection Service starting...")
    print("📊 Mock AI Model loaded (ready for ML upgrade)")
    print("✅ Service ready on http://localhost:8000")
    print("📚 API Docs available at http://localhost:8000/docs")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Waste Detection Service shutting down...")
