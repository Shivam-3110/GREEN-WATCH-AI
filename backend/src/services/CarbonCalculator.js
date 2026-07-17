import EmissionFactors from '../config/EmissionFactors.js'

const normalizeKey = (value, fallback) => {
  if (!value || typeof value !== 'string') return fallback
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits))

export const calculateTransportationCarbon = (transportation = {}) => {
  const {
    averageDistancePerDay = 0,
    domesticFlightsPerYear = 0,
    internationalFlightsPerYear = 0,
  } = transportation
  const vehicleType = normalizeKey(transportation.vehicleType, 'petrol_car')
  const vehicleFactor = EmissionFactors.transportation[vehicleType] ?? 0
  const monthlyGround = Number(averageDistancePerDay || 0) * EmissionFactors.assumptions.daysPerMonth * vehicleFactor
  const domesticMonthly = (
    Number(domesticFlightsPerYear || 0) *
    EmissionFactors.assumptions.averageDomesticFlightKm *
    EmissionFactors.flights.domestic
  ) / EmissionFactors.assumptions.monthsPerYear
  const internationalMonthly = (
    Number(internationalFlightsPerYear || 0) *
    EmissionFactors.assumptions.averageInternationalFlightKm *
    EmissionFactors.flights.international
  ) / EmissionFactors.assumptions.monthsPerYear

  return {
    total: round(monthlyGround + domesticMonthly + internationalMonthly),
    details: {
      vehicleType,
      dailyDistanceKm: Number(averageDistancePerDay || 0),
      groundTravel: round(monthlyGround),
      domesticFlights: round(domesticMonthly),
      internationalFlights: round(internationalMonthly),
    },
  }
}

export const calculateElectricityCarbon = (electricity = {}) => {
  const kWh = electricity.monthlyKWh !== undefined
    ? Number(electricity.monthlyKWh || 0)
    : Number(electricity.monthlyBillInr || 0) / EmissionFactors.assumptions.electricityCostPerKWhInr
  const total = kWh * EmissionFactors.electricity.grid_average

  return {
    total: round(total),
    details: {
      monthlyKWh: round(kWh),
      estimatedFromBill: electricity.monthlyKWh === undefined && electricity.monthlyBillInr !== undefined,
    },
  }
}

export const calculateCookingCarbon = (cooking = {}) => {
  const cookingFuel = normalizeKey(cooking.fuelType, 'lpg')
  const total = EmissionFactors.cooking[cookingFuel] ?? EmissionFactors.cooking.lpg

  return {
    total: round(total),
    details: { fuelType: cookingFuel },
  }
}

export const calculateFoodCarbon = (food = {}) => {
  const foodHabit = normalizeKey(food.habit, 'mixed_diet')
  const total = EmissionFactors.food[foodHabit] ?? EmissionFactors.food.mixed_diet

  return {
    total: round(total),
    details: { habit: foodHabit },
  }
}

export const calculateWasteCarbon = (waste = {}) => {
  const plasticUsage = normalizeKey(waste.plasticUsage, 'medium')
  const base = EmissionFactors.waste.plasticUsage[plasticUsage] ?? EmissionFactors.waste.plasticUsage.medium
  const total = waste.recycles ? base * (1 - EmissionFactors.waste.recyclingCredit) : base

  return {
    total: round(total),
    details: {
      plasticUsage,
      recycles: Boolean(waste.recycles),
      recyclingCreditApplied: Boolean(waste.recycles),
    },
  }
}

export const calculateWaterCarbon = (water = {}) => {
  const litersPerDay = Number(water.litersPerDay || 0)
  const total = litersPerDay * EmissionFactors.assumptions.daysPerMonth * EmissionFactors.water.kgCo2ePerLiter

  return {
    total: round(total),
    details: { litersPerDay },
  }
}

export const calculateCarbonFootprint = (lifestyle = {}) => {
  const breakdown = {
    transportation: calculateTransportationCarbon(lifestyle.transportation),
    electricity: calculateElectricityCarbon(lifestyle.electricity),
    cooking: calculateCookingCarbon(lifestyle.cooking),
    food: calculateFoodCarbon(lifestyle.food),
    waste: calculateWasteCarbon(lifestyle.waste),
    water: calculateWaterCarbon(lifestyle.water),
  }
  const monthlyCarbonKg = round(Object.values(breakdown).reduce((sum, item) => sum + item.total, 0))
  const yearlyCarbonKg = round(monthlyCarbonKg * EmissionFactors.assumptions.monthsPerYear)
  const percentages = Object.fromEntries(
    Object.entries(breakdown).map(([key, item]) => [
      key,
      monthlyCarbonKg > 0 ? round((item.total / monthlyCarbonKg) * 100, 1) : 0,
    ]),
  )
  const largestEmissionSource = Object.entries(breakdown).reduce(
    (largest, [key, item]) => (item.total > largest.value ? { category: key, value: item.total } : largest),
    { category: 'none', value: 0 },
  )

  return {
    monthlyCarbonKg,
    yearlyCarbonKg,
    breakdown,
    percentages,
    largestEmissionSource,
  }
}
