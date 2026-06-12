from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import time
from app.models.schemas import WasteAnalysisResponse, ErrorResponse
from app.services.detection_service import waste_detection_model
from app.utils.file_utils import validate_image_file, read_image_file

router = APIRouter(prefix="/api/v1/waste-detection", tags=["Waste Detection"])

@router.post(
    "/detect",
    response_model=WasteAnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Detect waste in uploaded image",
    description="Upload an image to detect and classify waste types using AI"
)
async def detect_waste(
    file: UploadFile = File(..., description="Image file (JPG, PNG, WEBP)")
):
    """
    Detect and classify waste in an uploaded image.
    
    - **file**: Image file containing waste objects
    
    Returns detailed analysis including:
    - Detected waste types
    - Confidence scores
    - Bounding boxes
    - Disposal recommendations
    - Environmental impact
    """
    start_time = time.time()
    
    try:
        # Validate file
        is_valid, error_message = validate_image_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Read image
        image_bytes = await read_image_file(file)
        
        # Perform detection
        detection_result = waste_detection_model.predict(image_bytes)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Build response
        response = WasteAnalysisResponse(
            filename=file.filename,
            detected_waste=detection_result['detected_waste'],
            detected_objects=detection_result['detected_objects'],
            primary_waste_type=detection_result['primary_waste_type'],
            overall_confidence=detection_result['overall_confidence'],
            environmental_impact=detection_result['environmental_impact'],
            recommendations=detection_result['recommendations'],
            processing_time_ms=round(processing_time, 2)
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@router.post(
    "/batch-detect",
    response_model=List[WasteAnalysisResponse],
    summary="Batch detect waste in multiple images",
    description="Upload multiple images for waste detection"
)
async def batch_detect_waste(
    files: List[UploadFile] = File(..., description="Multiple image files")
):
    """
    Detect waste in multiple images at once.
    
    - **files**: List of image files
    
    Returns analysis for each image.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 files allowed per batch"
        )
    
    results = []
    
    for file in files:
        try:
            result = await detect_waste(file)
            results.append(result)
        except HTTPException as e:
            # Add error result for failed file
            results.append(
                WasteAnalysisResponse(
                    success=False,
                    filename=file.filename,
                    detected_waste=[],
                    detected_objects=[],
                    primary_waste_type="error",
                    overall_confidence=0.0,
                    environmental_impact={},
                    recommendations=[f"Failed to process: {e.detail}"],
                    processing_time_ms=0.0
                )
            )
    
    return results

@router.get(
    "/supported-waste-types",
    summary="Get supported waste types",
    description="Retrieve list of waste types the model can detect"
)
async def get_supported_waste_types():
    """
    Get all supported waste types and their properties.
    """
    return {
        "success": True,
        "waste_types": [
            {
                "type": "plastic",
                "recyclable": True,
                "examples": ["bottles", "bags", "containers", "wrappers"]
            },
            {
                "type": "metal",
                "recyclable": True,
                "examples": ["cans", "foil", "scrap metal"]
            },
            {
                "type": "organic",
                "recyclable": False,
                "examples": ["food waste", "fruit peels", "garden waste"]
            },
            {
                "type": "e-waste",
                "recyclable": True,
                "examples": ["electronics", "batteries", "circuit boards", "cables"]
            }
        ]
    }

@router.get(
    "/model-info",
    summary="Get model information",
    description="Retrieve information about the detection model"
)
async def get_model_info():
    """
    Get information about the waste detection model.
    """
    return {
        "success": True,
        "model": {
            "name": "EcoSphere Waste Detection Model",
            "version": "1.0.0",
            "type": "Mock AI (Production-ready for real ML integration)",
            "supported_formats": ["jpg", "jpeg", "png", "webp"],
            "max_file_size_mb": 10,
            "confidence_threshold": 0.75,
            "waste_categories": 4,
            "ready_for_upgrade": True,
            "upgrade_path": "Replace detection_service.py with TensorFlow/YOLO model"
        }
    }
