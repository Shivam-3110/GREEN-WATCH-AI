import EmissionFactors from '../config/EmissionFactors.js'

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits))

export const convertCarbonImpact = ({ monthlyCarbonKg, yearlyCarbonKg }) => ({
  treesNeededToOffset: Math.ceil(yearlyCarbonKg / EmissionFactors.equivalents.treeAbsorptionKgPerYear),
  equivalentDrivingKm: Math.round(yearlyCarbonKg / EmissionFactors.equivalents.petrolCarKgPerKm),
  householdElectricityKWh: Math.round(monthlyCarbonKg / EmissionFactors.equivalents.householdElectricityKgPerKWh),
  coalBurnedKg: round(yearlyCarbonKg / EmissionFactors.equivalents.coalKgCo2PerKg),
  smartphoneCharges: Math.round(monthlyCarbonKg / EmissionFactors.equivalents.smartphoneChargeKgCo2e),
})
