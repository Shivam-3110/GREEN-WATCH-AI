import os
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

def validate_image_file(file: UploadFile) -> Tuple[bool, str]:
    """
    Validate uploaded image file.
    Returns (is_valid, error_message)
    """
    # Check file extension
    if not file.filename:
        return False, "No filename provided"
    
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"Invalid content type. Expected image file."
    
    return True, ""

async def read_image_file(file: UploadFile) -> bytes:
    """
    Read and validate image file.
    """
    # Read file content
    contents = await file.read()
    
    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Validate image format
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )
    
    return contents

def get_file_size_mb(size_bytes: int) -> float:
    """Convert bytes to megabytes."""
    return round(size_bytes / (1024 * 1024), 2)

def create_upload_directory(directory: str) -> None:
    """Create upload directory if it doesn't exist."""
    if not os.path.exists(directory):
        os.makedirs(directory)
