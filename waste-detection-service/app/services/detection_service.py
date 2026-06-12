import random
from typing import List, Tuple
from PIL import Image
import io

class MockWasteDetectionModel:
    """
    Mock AI model for waste detection.
    This simulates a real ML model and can be replaced with TensorFlow/YOLO later.
    """
    
    WASTE_CLASSES = {
        'plastic': {
            'items': ['plastic_bottle', 'plastic_bag', 'plastic_container', 'plastic_wrapper'],
            'recyclable': True,
            'disposal': 'Blue recycling bin - Clean and dry before disposal',
            'impact_score': 8,
            'decomposition_time': '450 years'
        },
        'metal': {
            'items': ['aluminum_can', 'steel_can', 'metal_scrap', 'foil'],
            'recyclable': True,
            'disposal': 'Metal recycling bin - Rinse before disposal',
            'impact_score': 6,
            'decomposition_time': '200 years'
        },
        'organic': {
            'items': ['food_waste', 'fruit_peel', 'vegetable_scraps', 'garden_waste'],
            'recyclable': False,
            'disposal': 'Compost bin or organic waste collection',
            'impact_score': 3,
            'decomposition_time': '1-6 months'
        },
        'e-waste': {
            'items': ['circuit_board', 'battery', 'phone', 'cable', 'electronic_device'],
            'recyclable': True,
            'disposal': 'E-waste collection center - Contains hazardous materials',
            'impact_score': 9,
            'decomposition_time': '1000+ years'
        }
    }
    
    def __init__(self):
        self.confidence_threshold = 0.75
        self.model_loaded = True
    
    def predict(self, image_bytes: bytes) -> dict:
        """
        Simulate waste detection on an image.
        In production, this would use a real ML model.
        """
        # Simulate image processing
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
        except Exception:
            width, height = 640, 480
        
        # Simulate detection based on image characteristics
        detected_waste_types = self._simulate_detection(image_bytes)
        
        # Generate detection results
        results = []
        detected_objects = []
        
        for waste_type in detected_waste_types:
            waste_info = self.WASTE_CLASSES[waste_type]
            confidence = random.uniform(0.75, 0.98)
            
            # Random item from waste type
            item = random.choice(waste_info['items'])
            
            results.append({
                'waste_type': waste_type,
                'confidence': round(confidence, 2),
                'recyclable': waste_info['recyclable'],
                'disposal_method': waste_info['disposal']
            })
            
            # Generate bounding box
            detected_objects.append({
                'class_name': item,
                'confidence': round(confidence, 2),
                'bounding_box': {
                    'x': random.randint(10, width // 2),
                    'y': random.randint(10, height // 2),
                    'width': random.randint(50, width // 3),
                    'height': random.randint(50, height // 3)
                }
            })
        
        # Primary waste type (highest confidence)
        primary_waste = max(results, key=lambda x: x['confidence'])
        
        # Calculate overall confidence
        overall_confidence = sum(r['confidence'] for r in results) / len(results)
        
        # Environmental impact
        impact_scores = [self.WASTE_CLASSES[r['waste_type']]['impact_score'] for r in results]
        avg_impact = sum(impact_scores) / len(impact_scores)
        
        environmental_impact = {
            'severity': self._get_severity(avg_impact),
            'decomposition_time': self.WASTE_CLASSES[primary_waste['waste_type']]['decomposition_time'],
            'carbon_footprint_kg': round(random.uniform(0.5, 5.0), 2),
            'recyclable_percentage': round(sum(1 for r in results if r['recyclable']) / len(results) * 100, 1)
        }
        
        # Recommendations
        recommendations = self._generate_recommendations(results, primary_waste['waste_type'])
        
        return {
            'detected_waste': results,
            'detected_objects': detected_objects,
            'primary_waste_type': primary_waste['waste_type'],
            'overall_confidence': round(overall_confidence, 2),
            'environmental_impact': environmental_impact,
            'recommendations': recommendations
        }
    
    def _simulate_detection(self, image_bytes: bytes) -> List[str]:
        """
        Simulate detection logic based on image characteristics.
        Returns 1-3 waste types.
        """
        # Use image size as seed for consistent results per image
        seed = len(image_bytes) % 100
        random.seed(seed)
        
        # Detect 1-3 waste types
        num_detections = random.randint(1, 3)
        waste_types = random.sample(list(self.WASTE_CLASSES.keys()), num_detections)
        
        return waste_types
    
    def _get_severity(self, impact_score: float) -> str:
        """Get severity level based on impact score."""
        if impact_score >= 8:
            return 'High'
        elif impact_score >= 5:
            return 'Medium'
        else:
            return 'Low'
    
    def _generate_recommendations(self, results: List[dict], primary_type: str) -> List[str]:
        """Generate disposal and environmental recommendations."""
        recommendations = []
        
        # Type-specific recommendations
        if primary_type == 'plastic':
            recommendations.extend([
                'Clean and dry plastic items before recycling',
                'Remove labels and caps when possible',
                'Consider reusable alternatives to reduce plastic waste'
            ])
        elif primary_type == 'metal':
            recommendations.extend([
                'Rinse metal containers to remove residue',
                'Flatten aluminum cans to save space',
                'Check for local metal recycling programs'
            ])
        elif primary_type == 'organic':
            recommendations.extend([
                'Start composting to reduce landfill waste',
                'Separate organic waste from other waste types',
                'Use compost as natural fertilizer for plants'
            ])
        elif primary_type == 'e-waste':
            recommendations.extend([
                'Never dispose e-waste in regular trash',
                'Find certified e-waste recycling centers',
                'Remove batteries before disposal',
                'Consider donating working electronics'
            ])
        
        # General recommendations
        recommendations.append('Practice waste segregation at source')
        
        if any(r['recyclable'] for r in results):
            recommendations.append('Ensure recyclable items are clean and dry')
        
        return recommendations[:5]  # Return top 5 recommendations

# Singleton instance
waste_detection_model = MockWasteDetectionModel()
