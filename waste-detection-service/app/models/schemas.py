from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WasteDetectionResult(BaseModel):
    waste_type: str = Field(..., description="Type of waste detected")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score between 0 and 1")
    recyclable: bool = Field(..., description="Whether the waste is recyclable")
    disposal_method: str = Field(..., description="Recommended disposal method")

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class DetectedObject(BaseModel):
    class_name: str
    confidence: float
    bounding_box: BoundingBox

class WasteAnalysisResponse(BaseModel):
    success: bool = True
    filename: str
    detected_waste: List[WasteDetectionResult]
    detected_objects: List[DetectedObject]
    primary_waste_type: str
    overall_confidence: float
    environmental_impact: dict
    recommendations: List[str]
    processing_time_ms: float
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
