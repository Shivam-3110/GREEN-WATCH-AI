import {
  calculateTotalFootprint,
  getSustainabilityLevel,
  getEnvironmentalImpact,
  generateRecommendations,
} from '../services/carbonFootprint.service.js';

export const calculateCarbonFootprint = async (req, res) => {
  try {
    const { vehicleUsage, electricityUsage, foodHabits, fuelConsumption } = req.body;

    // Calculate footprint
    const footprint = calculateTotalFootprint(
      vehicleUsage || {},
      electricityUsage || { kWh: 0 },
      foodHabits || {},
      fuelConsumption || {}
    );

    const sustainabilityLevel = getSustainabilityLevel(footprint.totalEmissions);
    const environmentalImpact = getEnvironmentalImpact(footprint.totalEmissions);
    const recommendations = generateRecommendations(footprint);

    res.status(200).json({
      success: true,
      data: {
        carbonFootprintScore: Math.round(footprint.totalEmissions),
        unit: 'kg CO2e',
        breakdown: footprint.categories,
        percentages: footprint.percentages,
        sustainabilityLevel: {
          level: sustainabilityLevel.level,
          grade: sustainabilityLevel.grade,
          description: sustainabilityLevel.description,
        },
        environmentalImpact,
        recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate carbon footprint',
      error: error.message,
    });
  }
};

export const getEmissionFactors = async (_req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        vehicle: ['car_petrol', 'car_diesel', 'car_electric', 'motorcycle', 'bus', 'train'],
        electricity: ['coal', 'natural_gas', 'renewable', 'grid_average'],
        food: ['beef', 'lamb', 'pork', 'chicken', 'fish', 'dairy', 'eggs', 'vegetables', 'fruits', 'grains'],
        fuel: ['petrol', 'diesel', 'lpg', 'natural_gas'],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emission factors',
      error: error.message,
    });
  }
};
