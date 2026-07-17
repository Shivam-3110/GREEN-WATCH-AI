const EmissionFactors = {
  assumptions: {
    daysPerMonth: 30,
    monthsPerYear: 12,
    electricityCostPerKWhInr: 8,
    averageDomesticFlightKm: 1200,
    averageInternationalFlightKm: 6500,
  },
  transportation: {
    petrol_car: 0.192,
    diesel_car: 0.171,
    electric_vehicle: 0.053,
    hybrid: 0.115,
    motorcycle: 0.113,
    public_transport: 0.089,
    bicycle: 0,
    walking: 0,
  },
  flights: {
    domestic: 0.158,
    international: 0.195,
  },
  electricity: {
    grid_average: 0.475,
  },
  cooking: {
    lpg: 45,
    png: 32,
    electric: 26,
    induction: 18,
    wood: 95,
    coal: 125,
  },
  food: {
    vegan: 65,
    vegetarian: 90,
    eggetarian: 115,
    mixed_diet: 155,
    heavy_meat: 245,
  },
  waste: {
    plasticUsage: {
      low: 8,
      medium: 22,
      high: 42,
    },
    recyclingCredit: 0.25,
  },
  water: {
    kgCo2ePerLiter: 0.0003,
  },
  equivalents: {
    treeAbsorptionKgPerYear: 21.77,
    petrolCarKgPerKm: 0.192,
    householdElectricityKgPerKWh: 0.475,
    coalKgCo2PerKg: 2.42,
    smartphoneChargeKgCo2e: 0.008,
  },
}

export default EmissionFactors
