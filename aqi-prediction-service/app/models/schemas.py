from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AQIInput(BaseModel):
    pm25: float = Field(..., ge=0, description="PM2.5 in µg/m³")
    pm10: float = Field(..., ge=0, description="PM10 in µg/m³")
    no2: float = Field(..., ge=0, description="NO2 in µg/m³")
    so2: float = Field(..., ge=0, description="SO2 in µg/m³")
    co: float = Field(..., ge=0, description="CO in µg/m³")
    o3: float = Field(..., ge=0, description="O3 in µg/m³")
    temperature: float = Field(..., description="Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Humidity in %")


class AQIForecastPoint(BaseModel):
    hour: int
    label: str
    aqi: float
    pm25: float
    pm10: float
    category: str
    color: str


class AQIPredictionResponse(BaseModel):
    success: bool = True
    current_aqi: float
    current_category: str
    predictions: List[AQIForecastPoint]
    health_advice: str
    model_confidence: float
    processing_time_ms: float
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class LocationPredictionRequest(BaseModel):
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
