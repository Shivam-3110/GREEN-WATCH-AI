from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.api.prediction import router as prediction_router
from app.models.schemas import HealthResponse, ErrorResponse
from app.services.prediction_service import aqi_prediction_service
import time

app = FastAPI(
    title='EcoSphere AQI Prediction API',
    description='LSTM-powered AQI forecasting microservice',
    version='1.0.0',
    docs_url='/docs',
    redoc_url='/redoc',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers['X-Process-Time'] = str(round((time.time() - start) * 1000, 2))
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(error='Validation Error', detail=str(exc.errors())).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error='Internal Server Error', detail=str(exc)).model_dump(),
    )


@app.get('/health', response_model=HealthResponse, tags=['Health'])
async def health_check():
    return HealthResponse(
        status='healthy',
        service='AQI Prediction Service',
        version='1.0.0',
        model_loaded=aqi_prediction_service.model_loaded,
    )


@app.get('/', tags=['Root'])
async def root():
    return {
        'service': 'EcoSphere AQI Prediction API',
        'version': '1.0.0',
        'status': 'online',
        'model': 'LSTM trained' if aqi_prediction_service.model_loaded else 'Physics fallback (run training/train.py)',
        'docs': '/docs',
        'health': '/health',
    }


app.include_router(prediction_router)


@app.on_event('startup')
async def startup_event():
    print('🚀 AQI Prediction Service starting...')
    print(f"🧠 Model: {'LSTM on ' + aqi_prediction_service.device.upper() if aqi_prediction_service.model_loaded else 'Physics-based fallback'}")
    print('✅ Service ready on http://localhost:8001')
    print('📚 API Docs at http://localhost:8001/docs')


@app.on_event('shutdown')
async def shutdown_event():
    print('👋 AQI Prediction Service shutting down...')
