/**
 * EcoSphere AI - Eco Score Calculation Engine
 * Calculates comprehensive environmental impact score (0-100)
 */

// Weight distribution for score calculation
const SCORE_WEIGHTS = {
  carbon: 0.30,        // 30% - Highest impact
  energy: 0.25,        // 25% - Major contributor
  transportation: 0.20, // 20% - Significant factor
  waste: 0.15,         // 15% - Important
  water: 0.10,         // 10% - Moderate impact
};

// Benchmark values (monthly averages)
const BENCHMARKS = {
  carbon: {
    excellent: 1000,    // kg CO2e
    good: 2000,
    average: 4000,
    poor: 6000,
    critical: 10000,
  },
  energy: {
    excellent: 150,     // kWh
    good: 250,
    average: 400,
    poor: 600,
    critical: 900,
  },
  transportation: {
    excellent: 50,      // km by fossil fuel vehicles
    good: 150,
    average: 300,
    poor: 500,
    critical: 800,
  },
  waste: {
    excellent: 10,      // kg
    good: 20,
    average: 40,
    poor: 60,
    critical: 100,
  },
  water: {
    excellent: 50,      // cubic meters
    good: 80,
    average: 120,
    poor: 180,
    critical: 250,
  },
};

// Score calculation for individual categories
const calculateCategoryScore = (value, benchmarks) => {
  if (value <= benchmarks.excellent) return 100;
  if (value <= benchmarks.good) return 85;
  if (value <= benchmarks.average) return 70;
  if (value <= benchmarks.poor) return 50;
  if (value <= benchmarks.critical) return 30;
  return 15; // Beyond critical
};

// Carbon footprint score calculation
export const calculateCarbonScore = (data) => {
  const { totalEmissions, breakdown } = data;
  
  const baseScore = calculateCategoryScore(totalEmissions, BENCHMARKS.carbon);
  
  // Bonus for renewable energy usage
  let bonus = 0;
  if (breakdown?.renewableEnergyPercentage > 50) bonus += 5;
  if (breakdown?.publicTransportPercentage > 50) bonus += 5;
  
  return {
    score: Math.min(100, baseScore + bonus),
    value: totalEmissions,
    unit: 'kg CO2e',
    level: getScoreLevel(baseScore),
  };
};

// Energy usage score calculation
export const calculateEnergyScore = (data) => {
  const { monthlyKWh, sourceType, efficiencyMeasures } = data;
  
  let baseScore = calculateCategoryScore(monthlyKWh, BENCHMARKS.energy);
  
  // Adjust based on energy source
  const sourceMultipliers = {
    renewable: 1.2,
    natural_gas: 1.0,
    coal: 0.8,
    grid_average: 0.95,
  };
  baseScore *= sourceMultipliers[sourceType] || 1.0;
  
  // Bonus for efficiency measures
  let bonus = 0;
  if (efficiencyMeasures?.ledLights) bonus += 2;
  if (efficiencyMeasures?.efficientAppliances) bonus += 3;
  if (efficiencyMeasures?.smartThermostat) bonus += 2;
  if (efficiencyMeasures?.solarPanels) bonus += 5;
  
  return {
    score: Math.min(100, baseScore + bonus),
    value: monthlyKWh,
    unit: 'kWh',
    level: getScoreLevel(baseScore),
  };
};

// Transportation habits score calculation
export const calculateTransportationScore = (data) => {
  const { vehicleUsage, publicTransit, cycling, walking } = data;
  
  // Calculate fossil fuel vehicle distance
  const fossilFuelDistance = 
    (vehicleUsage?.car_petrol || 0) + 
    (vehicleUsage?.car_diesel || 0) +
    (vehicleUsage?.motorcycle || 0);
  
  const baseScore = calculateCategoryScore(fossilFuelDistance, BENCHMARKS.transportation);
  
  // Bonus for sustainable transportation
  let bonus = 0;
  if (publicTransit > 100) bonus += 5;
  if (cycling > 50) bonus += 5;
  if (walking > 30) bonus += 3;
  if (vehicleUsage?.car_electric > 0) bonus += 8;
  
  const totalDistance = fossilFuelDistance + publicTransit + cycling + walking;
  const sustainablePercentage = totalDistance > 0 
    ? ((publicTransit + cycling + walking + (vehicleUsage?.car_electric || 0)) / totalDistance) * 100 
    : 0;
  
  return {
    score: Math.min(100, baseScore + bonus),
    value: fossilFuelDistance,
    unit: 'km fossil fuel',
    level: getScoreLevel(baseScore),
    sustainablePercentage: Math.round(sustainablePercentage),
  };
};

// Waste generation score calculation
export const calculateWasteScore = (data) => {
  const { totalWaste, recycled, composted, wasteTypes } = data;
  
  const baseScore = calculateCategoryScore(totalWaste, BENCHMARKS.waste);
  
  // Calculate recycling and composting rates
  const recyclingRate = totalWaste > 0 ? (recycled / totalWaste) * 100 : 0;
  const compostingRate = totalWaste > 0 ? (composted / totalWaste) * 100 : 0;
  
  // Bonus for waste management
  let bonus = 0;
  if (recyclingRate > 50) bonus += 5;
  if (compostingRate > 30) bonus += 5;
  if (wasteTypes?.reusableItems) bonus += 3;
  if (wasteTypes?.minimalPackaging) bonus += 2;
  
  // Penalty for hazardous waste
  let penalty = 0;
  if (wasteTypes?.hazardous > 0) penalty = 5;
  
  return {
    score: Math.max(0, Math.min(100, baseScore + bonus - penalty)),
    value: totalWaste,
    unit: 'kg',
    level: getScoreLevel(baseScore),
    recyclingRate: Math.round(recyclingRate),
    compostingRate: Math.round(compostingRate),
  };
};

// Water consumption score calculation
export const calculateWaterScore = (data) => {
  const { monthlyConsumption, conservationMeasures, outdoorUsage } = data;
  
  const baseScore = calculateCategoryScore(monthlyConsumption, BENCHMARKS.water);
  
  // Bonus for conservation measures
  let bonus = 0;
  if (conservationMeasures?.lowFlowFixtures) bonus += 3;
  if (conservationMeasures?.rainwaterHarvesting) bonus += 5;
  if (conservationMeasures?.efficientIrrigation) bonus += 4;
  if (conservationMeasures?.greyWaterReuse) bonus += 5;
  
  // Penalty for excessive outdoor usage
  let penalty = 0;
  if (outdoorUsage > monthlyConsumption * 0.5) penalty = 5;
  
  return {
    score: Math.max(0, Math.min(100, baseScore + bonus - penalty)),
    value: monthlyConsumption,
    unit: 'm³',
    level: getScoreLevel(baseScore),
  };
};

// Overall eco score calculation
export const calculateEcoScore = (carbonData, energyData, transportData, wasteData, waterData) => {
  const carbon = calculateCarbonScore(carbonData);
  const energy = calculateEnergyScore(energyData);
  const transportation = calculateTransportationScore(transportData);
  const waste = calculateWasteScore(wasteData);
  const water = calculateWaterScore(waterData);
  
  // Weighted average
  const totalScore = 
    (carbon.score * SCORE_WEIGHTS.carbon) +
    (energy.score * SCORE_WEIGHTS.energy) +
    (transportation.score * SCORE_WEIGHTS.transportation) +
    (waste.score * SCORE_WEIGHTS.waste) +
    (water.score * SCORE_WEIGHTS.water);
  
  const roundedScore = Math.round(totalScore);
  
  return {
    overallScore: roundedScore,
    grade: getGrade(roundedScore),
    level: getScoreLevel(roundedScore),
    breakdown: {
      carbon,
      energy,
      transportation,
      waste,
      water,
    },
    weights: SCORE_WEIGHTS,
    timestamp: new Date().toISOString(),
  };
};

// Get score level description
const getScoreLevel = (score) => {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Above Average';
  if (score >= 50) return 'Average';
  if (score >= 40) return 'Below Average';
  if (score >= 30) return 'Poor';
  return 'Critical';
};

// Get letter grade
const getGrade = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
};

// Generate personalized recommendations
export const generateRecommendations = (ecoScore) => {
  const recommendations = [];
  const { breakdown } = ecoScore;
  
  // Carbon recommendations
  if (breakdown.carbon.score < 70) {
    recommendations.push({
      category: 'Carbon Footprint',
      priority: breakdown.carbon.score < 50 ? 'Critical' : 'High',
      title: 'Reduce Carbon Emissions',
      suggestions: [
        'Switch to renewable energy sources',
        'Reduce meat consumption, especially beef',
        'Use public transportation or electric vehicles',
        'Improve home insulation to reduce heating/cooling needs',
      ],
      potentialImprovement: '+15-20 points',
    });
  }
  
  // Energy recommendations
  if (breakdown.energy.score < 70) {
    recommendations.push({
      category: 'Energy Usage',
      priority: breakdown.energy.score < 50 ? 'Critical' : 'High',
      title: 'Optimize Energy Consumption',
      suggestions: [
        'Install LED bulbs throughout your home',
        'Use energy-efficient appliances (Energy Star rated)',
        'Install a programmable or smart thermostat',
        'Consider solar panels or community solar programs',
        'Unplug devices when not in use',
      ],
      potentialImprovement: '+12-18 points',
    });
  }
  
  // Transportation recommendations
  if (breakdown.transportation.score < 70) {
    recommendations.push({
      category: 'Transportation',
      priority: breakdown.transportation.score < 50 ? 'Critical' : 'Medium',
      title: 'Adopt Sustainable Transportation',
      suggestions: [
        'Use public transit for daily commute',
        'Carpool with colleagues or neighbors',
        'Bike or walk for short distances',
        'Consider an electric or hybrid vehicle',
        'Work from home when possible',
      ],
      potentialImprovement: '+10-15 points',
    });
  }
  
  // Waste recommendations
  if (breakdown.waste.score < 70) {
    recommendations.push({
      category: 'Waste Management',
      priority: breakdown.waste.score < 50 ? 'High' : 'Medium',
      title: 'Improve Waste Practices',
      suggestions: [
        'Separate recyclables from general waste',
        'Start composting organic waste',
        'Reduce single-use plastics',
        'Buy products with minimal packaging',
        'Donate or repair items instead of discarding',
      ],
      potentialImprovement: '+8-12 points',
    });
  }
  
  // Water recommendations
  if (breakdown.water.score < 70) {
    recommendations.push({
      category: 'Water Conservation',
      priority: 'Medium',
      title: 'Conserve Water Resources',
      suggestions: [
        'Install low-flow showerheads and faucets',
        'Fix leaks promptly',
        'Use dishwasher and washing machine only when full',
        'Collect rainwater for plants',
        'Replace lawn with drought-resistant landscaping',
      ],
      potentialImprovement: '+5-8 points',
    });
  }
  
  // Quick wins for any score
  if (ecoScore.overallScore < 80) {
    recommendations.push({
      category: 'Quick Wins',
      priority: 'Easy',
      title: 'Simple Actions with Big Impact',
      suggestions: [
        'Bring reusable bags when shopping',
        'Use a reusable water bottle',
        'Adjust thermostat by 2°C (saves 10% energy)',
        'Air dry clothes instead of using dryer',
        'Meal plan to reduce food waste',
      ],
      potentialImprovement: '+5-10 points',
    });
  }
  
  // Sort by priority
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Easy': 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
};

// Get comparison to benchmarks
export const getComparison = (ecoScore) => {
  const { breakdown } = ecoScore;
  
  return {
    vsGlobalAverage: {
      carbon: breakdown.carbon.value < 4000 ? 'Below' : 'Above',
      energy: breakdown.energy.value < 400 ? 'Below' : 'Above',
      overall: ecoScore.overallScore > 60 ? 'Better' : 'Worse',
    },
    percentile: getPercentile(ecoScore.overallScore),
    equivalents: {
      treesNeeded: Math.ceil(breakdown.carbon.value / 21.77),
      carsEquivalent: (breakdown.carbon.value / 4600).toFixed(2),
      homesEnergy: (breakdown.energy.value / 877).toFixed(2),
    },
  };
};

// Get percentile ranking
const getPercentile = (score) => {
  if (score >= 90) return 'Top 5%';
  if (score >= 80) return 'Top 15%';
  if (score >= 70) return 'Top 30%';
  if (score >= 60) return 'Top 50%';
  if (score >= 50) return 'Average';
  return 'Bottom 50%';
};
