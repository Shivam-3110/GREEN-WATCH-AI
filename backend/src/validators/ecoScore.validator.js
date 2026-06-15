export const validateEcoScoreInput = (req, res, next) => {
  const { carbon, energy, transportation, waste, water } = req.body;

  // Validate at least one category is provided
  if (!carbon && !energy && !transportation && !waste && !water) {
    return res.status(400).json({
      success: false,
      message: 'At least one category (carbon, energy, transportation, waste, water) is required',
    });
  }

  // Validate carbon data
  if (carbon) {
    if (typeof carbon !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'carbon must be an object',
      });
    }
    if (carbon.totalEmissions !== undefined && (typeof carbon.totalEmissions !== 'number' || carbon.totalEmissions < 0)) {
      return res.status(400).json({
        success: false,
        message: 'carbon.totalEmissions must be a non-negative number',
      });
    }
  }

  // Validate energy data
  if (energy) {
    if (typeof energy !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'energy must be an object',
      });
    }
    if (energy.monthlyKWh !== undefined && (typeof energy.monthlyKWh !== 'number' || energy.monthlyKWh < 0)) {
      return res.status(400).json({
        success: false,
        message: 'energy.monthlyKWh must be a non-negative number',
      });
    }
  }

  // Validate transportation data
  if (transportation) {
    if (typeof transportation !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'transportation must be an object',
      });
    }
  }

  // Validate waste data
  if (waste) {
    if (typeof waste !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'waste must be an object',
      });
    }
    if (waste.totalWaste !== undefined && (typeof waste.totalWaste !== 'number' || waste.totalWaste < 0)) {
      return res.status(400).json({
        success: false,
        message: 'waste.totalWaste must be a non-negative number',
      });
    }
  }

  // Validate water data
  if (water) {
    if (typeof water !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'water must be an object',
      });
    }
    if (water.monthlyConsumption !== undefined && (typeof water.monthlyConsumption !== 'number' || water.monthlyConsumption < 0)) {
      return res.status(400).json({
        success: false,
        message: 'water.monthlyConsumption must be a non-negative number',
      });
    }
  }

  next();
};
