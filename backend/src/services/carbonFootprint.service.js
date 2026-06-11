/**
 * Carbon Footprint Calculation Service
 * Emission factors are in kg CO2e per unit
 */

const EMISSION_FACTORS = {
  // Vehicle emissions (kg CO2e per km)
  vehicle: {
    car_petrol: 0.192,
    car_diesel: 0.171,
    car_electric: 0.053,
    motorcycle: 0.113,
    bus: 0.089,
    train: 0.041,
  },
  // Electricity emissions (kg CO2e per kWh)
  electricity: {
    coal: 0.82,
    natural_gas: 0.49,
    renewable: 0.02,
    grid_average: 0.475,
  },
  // Food emissions (kg CO2e per kg)
  food: {
    beef: 27.0,
    lamb: 39.2,
    pork: 12.1,
    chicken: 6.9,
    fish: 5.0,
    dairy: 2.5,
    eggs: 4.5,
    vegetables: 0.4,
    fruits: 0.5,
    grains: 0.6,
  },
  // Fuel emissions (kg CO2e per liter)
  fuel: {
    petrol: 2.31,
    diesel: 2.68,
    lpg: 1.51,
    natural_gas_m3: 2.0,
  },
};

const SUSTAINABILITY_LEVELS = [
  { threshold: 1000, level: 'Excellent', grade: 'A+', description: 'Carbon negative lifestyle' },
  { threshold: 2000, level: 'Great', grade: 'A', description: 'Very low carbon footprint' },
  { threshold: 4000, level: 'Good', grade: 'B', description: 'Below average emissions' },
  { threshold: 6000, level: 'Average', grade: 'C', description: 'Typical emissions' },
  { threshold: 10000, level: 'Fair', grade: 'D', description: 'Above average emissions' },
  { threshold: Infinity, level: 'Poor', grade: 'F', description: 'High carbon footprint' },
];

export const calculateVehicleEmissions = (vehicleUsage) => {
  let total = 0;
  const breakdown = {};

  for (const [type, distance] of Object.entries(vehicleUsage)) {
    if (EMISSION_FACTORS.vehicle[type] && distance > 0) {
      const emissions = distance * EMISSION_FACTORS.vehicle[type];
      breakdown[type] = emissions;
      total += emissions;
    }
  }

  return { total, breakdown };
};

export const calculateElectricityEmissions = (electricityUsage) => {
  const { kWh, sourceType = 'grid_average' } = electricityUsage;
  const factor = EMISSION_FACTORS.electricity[sourceType] || EMISSION_FACTORS.electricity.grid_average;
  const total = kWh * factor;

  return {
    total,
    breakdown: { [sourceType]: total },
    averageDaily: total / 30,
  };
};

export const calculateFoodEmissions = (foodHabits) => {
  let total = 0;
  const breakdown = {};

  for (const [type, weight] of Object.entries(foodHabits)) {
    if (EMISSION_FACTORS.food[type] && weight > 0) {
      const emissions = weight * EMISSION_FACTORS.food[type];
      breakdown[type] = emissions;
      total += emissions;
    }
  }

  return { total, breakdown };
};

export const calculateFuelEmissions = (fuelConsumption) => {
  let total = 0;
  const breakdown = {};

  for (const [type, volume] of Object.entries(fuelConsumption)) {
    const factorKey = type === 'natural_gas' ? 'natural_gas_m3' : type;
    if (EMISSION_FACTORS.fuel[factorKey] && volume > 0) {
      const emissions = volume * EMISSION_FACTORS.fuel[factorKey];
      breakdown[type] = emissions;
      total += emissions;
    }
  }

  return { total, breakdown };
};

export const calculateTotalFootprint = (vehicleData, electricityData, foodData, fuelData) => {
  const vehicle = calculateVehicleEmissions(vehicleData);
  const electricity = calculateElectricityEmissions(electricityData);
  const food = calculateFoodEmissions(foodData);
  const fuel = calculateFuelEmissions(fuelData);

  const totalEmissions = vehicle.total + electricity.total + food.total + fuel.total;

  return {
    totalEmissions,
    categories: {
      vehicle,
      electricity,
      food,
      fuel,
    },
    percentages: {
      vehicle: ((vehicle.total / totalEmissions) * 100).toFixed(1),
      electricity: ((electricity.total / totalEmissions) * 100).toFixed(1),
      food: ((food.total / totalEmissions) * 100).toFixed(1),
      fuel: ((fuel.total / totalEmissions) * 100).toFixed(1),
    },
  };
};

export const getSustainabilityLevel = (totalEmissions) => {
  return SUSTAINABILITY_LEVELS.find(level => totalEmissions < level.threshold) || SUSTAINABILITY_LEVELS[SUSTAINABILITY_LEVELS.length - 1];
};

export const getEnvironmentalImpact = (totalEmissions) => {
  const treesNeeded = Math.ceil(totalEmissions / 21.77); // One tree absorbs ~21.77 kg CO2/year
  const equivalentCars = (totalEmissions / 4600).toFixed(2); // Average car emits ~4600 kg CO2/year
  const earthsRequired = (totalEmissions / 6000).toFixed(2); // Global avg per capita ~6000 kg

  return {
    treesNeededToOffset: treesNeeded,
    equivalentCarsPerYear: equivalentCars,
    earthsRequired: earthsRequired,
    comparisonToGlobalAverage: totalEmissions > 6000 ? 'Above' : 'Below',
  };
};

export const generateRecommendations = (footprint) => {
  const recommendations = [];
  const { categories, percentages } = footprint;

  if (percentages.vehicle > 30) {
    recommendations.push({
      category: 'Transportation',
      priority: 'High',
      suggestion: 'Consider public transport, carpooling, or electric vehicles',
      potentialSavings: `${(categories.vehicle.total * 0.4).toFixed(0)} kg CO2e`,
    });
  }

  if (percentages.electricity > 25) {
    recommendations.push({
      category: 'Energy',
      priority: 'High',
      suggestion: 'Switch to renewable energy sources and improve energy efficiency',
      potentialSavings: `${(categories.electricity.total * 0.5).toFixed(0)} kg CO2e`,
    });
  }

  if (percentages.food > 30 && categories.food.breakdown.beef) {
    recommendations.push({
      category: 'Diet',
      priority: 'Medium',
      suggestion: 'Reduce meat consumption, especially beef and lamb',
      potentialSavings: `${(categories.food.total * 0.6).toFixed(0)} kg CO2e`,
    });
  }

  if (percentages.fuel > 20) {
    recommendations.push({
      category: 'Fuel',
      priority: 'Medium',
      suggestion: 'Optimize heating/cooling and consider energy-efficient appliances',
      potentialSavings: `${(categories.fuel.total * 0.3).toFixed(0)} kg CO2e`,
    });
  }

  return recommendations;
};
