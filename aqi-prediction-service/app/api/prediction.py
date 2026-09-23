import time
import os
import requests
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    AQIInput,
    AQIPredictionResponse,
    AQIForecastPoint,
    LocationPredictionRequest,
    ErrorResponse,
)
from app.services.prediction_service import aqi_prediction_service

router = APIRouter(prefix='/api/v1/aqi-prediction', tags=['AQI Prediction'])


@router.post(
    '/predict',
    response_model=AQIPredictionResponse,
    responses={400: {'model': ErrorResponse}, 500: {'model': ErrorResponse}},
    summary='Predict AQI for next 24 hours from pollutant inputs',
)
async def predict_aqi(data: AQIInput):
    start = time.time()
    try:
        result = aqi_prediction_service.predict(data.model_dump())
        processing_time = (time.time() - start) * 1000

        return AQIPredictionResponse(
            current_aqi=result['current_aqi'],
            current_category=result['current_category'],
            predictions=[AQIForecastPoint(**p) for p in result['predictions']],
            health_advice=result['health_advice'],
            model_confidence=result['model_confidence'],
            processing_time_ms=round(processing_time, 2),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    '/predict-by-location',
    response_model=AQIPredictionResponse,
    responses={400: {'model': ErrorResponse}, 500: {'model': ErrorResponse}},
    summary='Fetch live AQI data by lat/lon then predict next 24 hours',
)
async def predict_by_location(req: LocationPredictionRequest):
    """
    Fetches live pollutant data from OpenWeatherMap using lat/lon,
    then runs the LSTM prediction on it.
    """
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail='OPENWEATHER_API_KEY not configured')

    start = time.time()

    try:
        # Fetch live AQI data
        aq_resp = requests.get(
            'https://api.openweathermap.org/data/2.5/air_pollution',
            params={'lat': req.lat, 'lon': req.lon, 'appid': api_key},
            timeout=10,
        )
        aq_resp.raise_for_status()
        aq_data = aq_resp.json()['list'][0]

        # Fetch weather for temperature + humidity
        w_resp = requests.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params={'lat': req.lat, 'lon': req.lon, 'appid': api_key, 'units': 'metric'},
            timeout=10,
        )
        w_resp.raise_for_status()
        w_data = w_resp.json()

        components = aq_data['components']
        input_data = {
            'pm25':        components.get('pm2_5', 0),
            'pm10':        components.get('pm10', 0),
            'no2':         components.get('no2', 0),
            'so2':         components.get('so2', 0),
            'co':          components.get('co', 0),
            'o3':          components.get('o3', 0),
            'temperature': w_data['main'].get('temp', 25),
            'humidity':    w_data['main'].get('humidity', 50),
        }

        result = aqi_prediction_service.predict(input_data)
        processing_time = (time.time() - start) * 1000

        return AQIPredictionResponse(
            current_aqi=result['current_aqi'],
            current_category=result['current_category'],
            predictions=[AQIForecastPoint(**p) for p in result['predictions']],
            health_advice=result['health_advice'],
            model_confidence=result['model_confidence'],
            processing_time_ms=round(processing_time, 2),
        )

    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f'Failed to fetch live AQI data: {str(e)}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/model-info', summary='Get model information')
async def model_info():
    return {
        'success': True,
        'model': {
            'name': 'AQI LSTM Prediction Model',
            'version': '1.0.0',
            'type': 'LSTM (PyTorch)' if aqi_prediction_service.model_loaded else 'Physics-based fallback',
            'trained': aqi_prediction_service.model_loaded,
            'device': aqi_prediction_service.device,
            'input_features': ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity'],
            'output': '24-hour AQI forecast',
            'upgrade_path': 'Run training/train.py to train the LSTM model',
        },
    }
