export const validateCarbonFootprintInput = (req, res, next) => {
  const { vehicleUsage, electricityUsage, foodHabits, fuelConsumption } = req.body;

  // Validate at least one input is provided
  if (!vehicleUsage && !electricityUsage && !foodHabits && !fuelConsumption) {
    return res.status(400).json({
      success: false,
      message: 'At least one category of data is required',
    });
  }

  // Validate vehicleUsage
  if (vehicleUsage && typeof vehicleUsage !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'vehicleUsage must be an object',
    });
  }

  // Validate electricityUsage
  if (electricityUsage) {
    if (typeof electricityUsage !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'electricityUsage must be an object',
      });
    }
    if (electricityUsage.kWh !== undefined && (typeof electricityUsage.kWh !== 'number' || electricityUsage.kWh < 0)) {
      return res.status(400).json({
        success: false,
        message: 'electricityUsage.kWh must be a non-negative number',
      });
    }
  }

  // Validate foodHabits
  if (foodHabits && typeof foodHabits !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'foodHabits must be an object',
    });
  }

  // Validate fuelConsumption
  if (fuelConsumption && typeof fuelConsumption !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'fuelConsumption must be an object',
    });
  }

  next();
};
