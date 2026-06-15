# EcoSphere AI - Eco Score Engine API Documentation

## Overview
The Eco Score Engine calculates a comprehensive environmental impact score (0-100) based on five key categories with AI-powered recommendations.

## Base URL
`/api/v1/eco-score`

---

## Scoring Algorithm

### Score Calculation
- **Overall Score**: Weighted average of 5 categories (0-100 scale)
- **Grade System**: A+ to F (similar to academic grading)
- **Level System**: 8 levels from "Critical" to "Exceptional"

### Category Weights
```javascript
{
  carbon: 30%,        // Highest impact
  energy: 25%,        // Major contributor
  transportation: 20%, // Significant factor
  waste: 15%,         // Important
  water: 10%          // Moderate impact
}
```

### Score Ranges

| Score Range | Grade | Level | Description |
|------------|-------|-------|-------------|
| 95-100 | A+ | Exceptional | Sustainability champion |
| 90-94 | A | Exceptional | Minimal environmental impact |
| 85-89 | A- | Excellent | Well above average |
| 80-84 | B+ | Excellent | Excellent practices |
| 75-79 | B | Excellent | Good with optimization potential |
| 70-74 | B- | Good | Above average |
| 65-69 | C+ | Good | Room for improvement |
| 60-64 | C | Above Average | Decent but improvable |
| 55-59 | C- | Above Average | Needs attention |
| 50-54 | D+ | Average | Substantial improvement needed |
| 45-49 | D | Average | Below desired level |
| 40-44 | D- | Below Average | Requires improvement |
| 30-39 | F | Poor | High impact, urgent changes needed |
| 0-29 | F | Critical | Critical impact, immediate action required |

---

## Endpoints

### 1. Calculate Eco Score
**POST** `/calculate`

Calculate comprehensive eco score based on user data.

#### Request Body
```json
{
  "carbon": {
    "totalEmissions": 3500,
    "breakdown": {
      "renewableEnergyPercentage": 30,
      "publicTransportPercentage": 40
    }
  },
  "energy": {
    "monthlyKWh": 350,
    "sourceType": "grid_average",
    "efficiencyMeasures": {
      "ledLights": true,
      "efficientAppliances": true,
      "smartThermostat": false,
      "solarPanels": false
    }
  },
  "transportation": {
    "vehicleUsage": {
      "car_petrol": 200,
      "car_diesel": 0,
      "car_electric": 100,
      "motorcycle": 50
    },
    "publicTransit": 150,
    "cycling": 80,
    "walking": 50
  },
  "waste": {
    "totalWaste": 30,
    "recycled": 15,
    "composted": 8,
    "wasteTypes": {
      "reusableItems": true,
      "minimalPackaging": true,
      "hazardous": 0
    }
  },
  "water": {
    "monthlyConsumption": 90,
    "conservationMeasures": {
      "lowFlowFixtures": true,
      "rainwaterHarvesting": false,
      "efficientIrrigation": true,
      "greyWaterReuse": false
    },
    "outdoorUsage": 30
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "ecoScore": {
      "overallScore": 72,
      "grade": "B-",
      "level": "Good",
      "breakdown": {
        "carbon": {
          "score": 68,
          "value": 3500,
          "unit": "kg CO2e",
          "level": "Good"
        },
        "energy": {
          "score": 75,
          "value": 350,
          "unit": "kWh",
          "level": "Good"
        },
        "transportation": {
          "score": 78,
          "value": 250,
          "unit": "km fossil fuel",
          "level": "Good",
          "sustainablePercentage": 62
        },
        "waste": {
          "score": 80,
          "value": 30,
          "unit": "kg",
          "level": "Excellent",
          "recyclingRate": 50,
          "compostingRate": 27
        },
        "water": {
          "score": 82,
          "value": 90,
          "unit": "m³",
          "level": "Excellent"
        }
      },
      "weights": {
        "carbon": 0.30,
        "energy": 0.25,
        "transportation": 0.20,
        "waste": 0.15,
        "water": 0.10
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "recommendations": [
      {
        "category": "Carbon Footprint",
        "priority": "High",
        "title": "Reduce Carbon Emissions",
        "suggestions": [
          "Switch to renewable energy sources",
          "Reduce meat consumption, especially beef",
          "Use public transportation or electric vehicles",
          "Improve home insulation"
        ],
        "potentialImprovement": "+15-20 points"
      },
      {
        "category": "Energy Usage",
        "priority": "Medium",
        "title": "Optimize Energy Consumption",
        "suggestions": [
          "Install LED bulbs throughout your home",
          "Use energy-efficient appliances",
          "Install a programmable thermostat",
          "Consider solar panels"
        ],
        "potentialImprovement": "+12-18 points"
      }
    ],
    "comparison": {
      "vsGlobalAverage": {
        "carbon": "Below",
        "energy": "Below",
        "overall": "Better"
      },
      "percentile": "Top 30%",
      "equivalents": {
        "treesNeeded": 161,
        "carsEquivalent": "0.76",
        "homesEnergy": "0.40"
      }
    },
    "insights": [
      {
        "type": "neutral",
        "message": "Good progress! Your score of 72 is above average, but there's room for improvement."
      },
      {
        "type": "info",
        "message": "Your strongest area is water (82/100). Great job!"
      },
      {
        "type": "action",
        "message": "Focus on improving carbon (68/100) for the biggest impact."
      },
      {
        "type": "positive",
        "message": "Outstanding! 62% of your travel is sustainable."
      }
    ]
  }
}
```

### 2. Get Score Breakdown
**GET** `/breakdown?score=75`

Get detailed breakdown for a specific score.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "score": 75,
    "grade": "B",
    "level": "Excellent",
    "description": "Your environmental practices are excellent and well above average.",
    "nextMilestone": {
      "score": 80,
      "grade": "B+",
      "pointsNeeded": 5,
      "message": "Reach Excellent level"
    }
  }
}
```

### 3. Get Benchmarks
**GET** `/benchmarks`

Get scoring benchmarks and category weights.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "categories": {
      "carbon": {
        "unit": "kg CO2e per month",
        "excellent": "< 1000",
        "good": "1000-2000",
        "average": "2000-4000",
        "poor": "4000-6000",
        "critical": "> 6000"
      },
      "energy": {
        "unit": "kWh per month",
        "excellent": "< 150",
        "good": "150-250",
        "average": "250-400",
        "poor": "400-600",
        "critical": "> 600"
      },
      "transportation": {
        "unit": "km fossil fuel per month",
        "excellent": "< 50",
        "good": "50-150",
        "average": "150-300",
        "poor": "300-500",
        "critical": "> 500"
      },
      "waste": {
        "unit": "kg per month",
        "excellent": "< 10",
        "good": "10-20",
        "average": "20-40",
        "poor": "40-60",
        "critical": "> 60"
      },
      "water": {
        "unit": "m³ per month",
        "excellent": "< 50",
        "good": "50-80",
        "average": "80-120",
        "poor": "120-180",
        "critical": "> 180"
      }
    },
    "weights": {
      "carbon": "30%",
      "energy": "25%",
      "transportation": "20%",
      "waste": "15%",
      "water": "10%"
    }
  }
}
```

---

## Scoring Examples

### Example 1: Eco Champion (Score: 92)
```json
{
  "carbon": { "totalEmissions": 800 },
  "energy": { "monthlyKWh": 120, "sourceType": "renewable" },
  "transportation": { 
    "vehicleUsage": { "car_electric": 150 },
    "publicTransit": 200,
    "cycling": 100
  },
  "waste": { "totalWaste": 12, "recycled": 10, "composted": 2 },
  "water": { "monthlyConsumption": 45 }
}
```
**Result**: Grade A, "Exceptional" - Sustainability champion

### Example 2: Good Performer (Score: 74)
```json
{
  "carbon": { "totalEmissions": 2500 },
  "energy": { "monthlyKWh": 300, "sourceType": "grid_average" },
  "transportation": { 
    "vehicleUsage": { "car_petrol": 200 },
    "publicTransit": 100
  },
  "waste": { "totalWaste": 25, "recycled": 12 },
  "water": { "monthlyConsumption": 100 }
}
```
**Result**: Grade B-, "Good" - Above average with optimization potential

### Example 3: Needs Improvement (Score: 48)
```json
{
  "carbon": { "totalEmissions": 6500 },
  "energy": { "monthlyKWh": 650, "sourceType": "coal" },
  "transportation": { 
    "vehicleUsage": { "car_petrol": 600, "car_diesel": 200 }
  },
  "waste": { "totalWaste": 70, "recycled": 5 },
  "water": { "monthlyConsumption": 200 }
}
```
**Result**: Grade D, "Average" - Substantial improvement needed

---

## Recommendation System

### Priority Levels
- **Critical**: Score < 50 in category (immediate action required)
- **High**: Score < 70 in category (significant improvement needed)
- **Medium**: Score 70-80 in category (optimization recommended)
- **Easy**: Quick wins for any score < 80

### Recommendation Categories
1. **Carbon Footprint**: Emissions reduction strategies
2. **Energy Usage**: Efficiency improvements
3. **Transportation**: Sustainable mobility options
4. **Waste Management**: Recycling and reduction
5. **Water Conservation**: Usage optimization
6. **Quick Wins**: Simple high-impact actions

### Potential Improvements
Each recommendation includes estimated score improvement:
- High impact: +15-20 points
- Medium impact: +10-15 points
- Low impact: +5-10 points

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "At least one category (carbon, energy, transportation, waste, water) is required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to calculate eco score",
  "error": "Error details"
}
```

---

## Integration Tips

1. **Collect comprehensive data** for accurate scoring
2. **Use benchmarks** to guide user input
3. **Display recommendations** prominently
4. **Show progress over time** with historical scores
5. **Gamify improvements** with milestones and achievements
6. **Provide context** with comparisons and equivalents

---

## Algorithm Logic

### Category Score Calculation
1. Compare user value against benchmarks
2. Calculate base score (0-100)
3. Apply bonuses for positive actions (+2 to +8 points)
4. Apply penalties for negative actions (-5 points)
5. Cap at 100, floor at 0

### Overall Score Calculation
1. Calculate individual category scores
2. Apply category weights
3. Sum weighted scores
4. Round to nearest integer
5. Assign grade and level

### Recommendation Generation
1. Identify categories with score < 70
2. Prioritize by score (lower = higher priority)
3. Generate category-specific suggestions
4. Add quick wins for overall score < 80
5. Sort by priority level
6. Return top 5-7 recommendations

---

Built with ❤️ for EcoSphere AI
