# Carbon Footprint API Documentation

## Base URL
`/api/v1/carbon-footprint`

## Endpoints

### 1. Calculate Carbon Footprint
**POST** `/calculate`

Calculate carbon footprint based on user inputs.

#### Request Body
```json
{
  "vehicleUsage": {
    "car_petrol": 500,      // km per month
    "car_diesel": 0,
    "car_electric": 0,
    "motorcycle": 50,
    "bus": 100,
    "train": 200
  },
  "electricityUsage": {
    "kWh": 350,             // kWh per month
    "sourceType": "grid_average"  // Options: coal, natural_gas, renewable, grid_average
  },
  "foodHabits": {
    "beef": 2,              // kg per month
    "lamb": 0,
    "pork": 3,
    "chicken": 8,
    "fish": 4,
    "dairy": 15,
    "eggs": 6,
    "vegetables": 20,
    "fruits": 15,
    "grains": 10
  },
  "fuelConsumption": {
    "petrol": 100,          // liters per month
    "diesel": 0,
    "lpg": 0,
    "natural_gas": 50       // m³ per month
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "carbonFootprintScore": 1250,
    "unit": "kg CO2e",
    "breakdown": {
      "vehicle": {
        "total": 350.5,
        "breakdown": {
          "car_petrol": 96.0,
          "motorcycle": 5.65,
          "bus": 8.9,
          "train": 8.2
        }
      },
      "electricity": {
        "total": 166.25,
        "breakdown": {
          "grid_average": 166.25
        },
        "averageDaily": 5.54
      },
      "food": {
        "total": 215.3,
        "breakdown": {
          "beef": 54.0,
          "pork": 36.3,
          "chicken": 55.2,
          "fish": 20.0,
          "dairy": 37.5,
          "eggs": 27.0
        }
      },
      "fuel": {
        "total": 331.0,
        "breakdown": {
          "petrol": 231.0,
          "natural_gas": 100.0
        }
      }
    },
    "percentages": {
      "vehicle": "28.1",
      "electricity": "13.3",
      "food": "17.2",
      "fuel": "26.5"
    },
    "sustainabilityLevel": {
      "level": "Good",
      "grade": "B",
      "description": "Below average emissions"
    },
    "environmentalImpact": {
      "treesNeededToOffset": 58,
      "equivalentCarsPerYear": "0.27",
      "earthsRequired": "0.21",
      "comparisonToGlobalAverage": "Below"
    },
    "recommendations": [
      {
        "category": "Transportation",
        "priority": "High",
        "suggestion": "Consider public transport, carpooling, or electric vehicles",
        "potentialSavings": "140 kg CO2e"
      }
    ]
  }
}
```

### 2. Get Emission Factors
**GET** `/emission-factors`

Get available emission factor categories.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "vehicle": ["car_petrol", "car_diesel", "car_electric", "motorcycle", "bus", "train"],
    "electricity": ["coal", "natural_gas", "renewable", "grid_average"],
    "food": ["beef", "lamb", "pork", "chicken", "fish", "dairy", "eggs", "vegetables", "fruits", "grains"],
    "fuel": ["petrol", "diesel", "lpg", "natural_gas"]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "At least one category of data is required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to calculate carbon footprint",
  "error": "Error details"
}
```

## Emission Factors Reference

### Vehicle (kg CO2e per km)
- Petrol Car: 0.192
- Diesel Car: 0.171
- Electric Car: 0.053
- Motorcycle: 0.113
- Bus: 0.089
- Train: 0.041

### Electricity (kg CO2e per kWh)
- Coal: 0.82
- Natural Gas: 0.49
- Renewable: 0.02
- Grid Average: 0.475

### Food (kg CO2e per kg)
- Beef: 27.0
- Lamb: 39.2
- Pork: 12.1
- Chicken: 6.9
- Fish: 5.0
- Dairy: 2.5
- Eggs: 4.5
- Vegetables: 0.4
- Fruits: 0.5
- Grains: 0.6

### Fuel (kg CO2e per liter/m³)
- Petrol: 2.31
- Diesel: 2.68
- LPG: 1.51
- Natural Gas (m³): 2.0

## Sustainability Levels
- **A+** (< 1000 kg): Excellent - Carbon negative lifestyle
- **A** (< 2000 kg): Great - Very low carbon footprint
- **B** (< 4000 kg): Good - Below average emissions
- **C** (< 6000 kg): Average - Typical emissions
- **D** (< 10000 kg): Fair - Above average emissions
- **F** (≥ 10000 kg): Poor - High carbon footprint
