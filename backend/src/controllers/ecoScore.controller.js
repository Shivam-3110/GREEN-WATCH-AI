import {
  calculateEcoScore,
  generateRecommendations,
  getComparison,
} from '../services/ecoScore.service.js';

export const calculateUserEcoScore = async (req, res) => {
  try {
    const { carbon, energy, transportation, waste, water } = req.body;

    // Validate required data
    if (!carbon && !energy && !transportation && !waste && !water) {
      return res.status(400).json({
        success: false,
        message: 'At least one category of data is required',
      });
    }

    // Calculate eco score
    const ecoScore = calculateEcoScore(
      carbon || {},
      energy || {},
      transportation || {},
      waste || {},
      water || {}
    );

    // Generate recommendations
    const recommendations = generateRecommendations(ecoScore);

    // Get comparison data
    const comparison = getComparison(ecoScore);

    res.status(200).json({
      success: true,
      data: {
        ecoScore,
        recommendations,
        comparison,
        insights: generateInsights(ecoScore),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate eco score',
      error: error.message,
    });
  }
};

export const getScoreBreakdown = async (req, res) => {
  try {
    const { score } = req.query;

    if (!score || isNaN(score)) {
      return res.status(400).json({
        success: false,
        message: 'Valid score parameter is required',
      });
    }

    const scoreValue = parseInt(score);

    res.status(200).json({
      success: true,
      data: {
        score: scoreValue,
        grade: getGrade(scoreValue),
        level: getScoreLevel(scoreValue),
        description: getScoreDescription(scoreValue),
        nextMilestone: getNextMilestone(scoreValue),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get score breakdown',
      error: error.message,
    });
  }
};

export const getBenchmarks = async (_req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        categories: {
          carbon: {
            unit: 'kg CO2e per month',
            excellent: '< 1000',
            good: '1000-2000',
            average: '2000-4000',
            poor: '4000-6000',
            critical: '> 6000',
          },
          energy: {
            unit: 'kWh per month',
            excellent: '< 150',
            good: '150-250',
            average: '250-400',
            poor: '400-600',
            critical: '> 600',
          },
          transportation: {
            unit: 'km fossil fuel per month',
            excellent: '< 50',
            good: '50-150',
            average: '150-300',
            poor: '300-500',
            critical: '> 500',
          },
          waste: {
            unit: 'kg per month',
            excellent: '< 10',
            good: '10-20',
            average: '20-40',
            poor: '40-60',
            critical: '> 60',
          },
          water: {
            unit: 'm³ per month',
            excellent: '< 50',
            good: '50-80',
            average: '80-120',
            poor: '120-180',
            critical: '> 180',
          },
        },
        weights: {
          carbon: '30%',
          energy: '25%',
          transportation: '20%',
          waste: '15%',
          water: '10%',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmarks',
      error: error.message,
    });
  }
};

// Helper functions
const generateInsights = (ecoScore) => {
  const insights = [];
  const { breakdown, overallScore } = ecoScore;

  // Overall performance insight
  if (overallScore >= 80) {
    insights.push({
      type: 'positive',
      message: `Excellent work! Your eco score of ${overallScore} puts you in the top tier of environmental consciousness.`,
    });
  } else if (overallScore >= 60) {
    insights.push({
      type: 'neutral',
      message: `Good progress! Your score of ${overallScore} is above average, but there's room for improvement.`,
    });
  } else {
    insights.push({
      type: 'warning',
      message: `Your eco score of ${overallScore} indicates significant room for improvement in your environmental impact.`,
    });
  }

  // Category-specific insights
  const categories = Object.entries(breakdown);
  const bestCategory = categories.reduce((max, cat) => cat[1].score > max[1].score ? cat : max);
  const worstCategory = categories.reduce((min, cat) => cat[1].score < min[1].score ? cat : min);

  insights.push({
    type: 'info',
    message: `Your strongest area is ${bestCategory[0]} (${bestCategory[1].score}/100). Great job!`,
  });

  insights.push({
    type: 'action',
    message: `Focus on improving ${worstCategory[0]} (${worstCategory[1].score}/100) for the biggest impact.`,
  });

  // Transportation insight
  if (breakdown.transportation.sustainablePercentage) {
    if (breakdown.transportation.sustainablePercentage > 70) {
      insights.push({
        type: 'positive',
        message: `Outstanding! ${breakdown.transportation.sustainablePercentage}% of your travel is sustainable.`,
      });
    } else if (breakdown.transportation.sustainablePercentage < 30) {
      insights.push({
        type: 'warning',
        message: `Only ${breakdown.transportation.sustainablePercentage}% of your travel is sustainable. Consider public transit or cycling.`,
      });
    }
  }

  // Waste insight
  if (breakdown.waste.recyclingRate !== undefined) {
    if (breakdown.waste.recyclingRate > 60) {
      insights.push({
        type: 'positive',
        message: `Excellent recycling rate of ${breakdown.waste.recyclingRate}%! Keep it up.`,
      });
    } else if (breakdown.waste.recyclingRate < 30) {
      insights.push({
        type: 'warning',
        message: `Your recycling rate is ${breakdown.waste.recyclingRate}%. Aim for at least 50% to reduce landfill waste.`,
      });
    }
  }

  return insights;
};

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

const getScoreDescription = (score) => {
  if (score >= 90) return 'You are a sustainability champion with minimal environmental impact.';
  if (score >= 80) return 'Your environmental practices are excellent and well above average.';
  if (score >= 70) return 'You have good environmental habits with room for optimization.';
  if (score >= 60) return 'Your impact is above average but could be significantly improved.';
  if (score >= 50) return 'Your environmental impact is average with substantial improvement potential.';
  if (score >= 40) return 'Your practices need improvement to reduce environmental harm.';
  if (score >= 30) return 'Your environmental impact is high and requires immediate attention.';
  return 'Critical environmental impact requiring urgent lifestyle changes.';
};

const getNextMilestone = (score) => {
  const milestones = [40, 50, 60, 70, 80, 90, 95];
  const next = milestones.find(m => m > score);
  
  if (!next) {
    return {
      score: 100,
      grade: 'A+',
      pointsNeeded: 100 - score,
      message: 'Achieve perfect eco score!',
    };
  }
  
  return {
    score: next,
    grade: getGrade(next),
    pointsNeeded: next - score,
    message: `Reach ${getScoreLevel(next)} level`,
  };
};
