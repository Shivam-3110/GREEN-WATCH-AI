/**
 * ImpactCalculators.js
 * Each function returns a signed AQI delta (positive = worsens, negative = improves).
 * All values are grounded in real-world environmental science ratios.
 */

/**
 * Industrial pollution is the dominant source of PM2.5, SO2, and NOx.
 * At 100% slider → +80 AQI contribution (heavy industrial zone baseline).
 * Scales non-linearly: doubling pollution more than doubles impact.
 */
export function industrialImpact(pollutionRatio) {
  // pollutionRatio: 0–1
  return Math.round(pollutionRatio * pollutionRatio * 80);
}

/**
 * Traffic contributes PM2.5, PM10, NO2 via combustion and tyre/brake wear.
 * At 100% traffic → +50 AQI.
 * Includes a PM2.5 proxy: traffic * 25 µg/m³ equivalent.
 */
export function trafficImpact(trafficRatio, existingPM25 = 0) {
  const baseTrafficAQI = trafficRatio * 50;
  // Extra penalty if existing PM2.5 is already elevated (compounding effect)
  const pm25Penalty = existingPM25 > 35 ? (existingPM25 - 35) * 0.3 : 0;
  return Math.round(baseTrafficAQI + pm25Penalty);
}

/**
 * Trees absorb CO2, PM2.5, NO2, and O3.
 * Each tree in a 1km² urban area absorbs ~1.5 kg of pollutants/year.
 * 50 trees at max → −40 AQI reduction.
 * Effectiveness scales with existing pollution (more pollution = trees work harder).
 */
export function treeAbsorptionImpact(treeCount, currentAQI) {
  const maxTrees = 50;
  const baseReduction = (treeCount / maxTrees) * 40;
  // Trees are more effective when pollution is high
  const efficiencyBonus = currentAQI > 100 ? (currentAQI - 100) * 0.05 : 0;
  return -Math.round(baseReduction + Math.min(efficiencyBonus, 15));
}

/**
 * Temperature accelerates photochemical reactions forming O3 and secondary PM.
 * Below 25°C: slight benefit (−2 AQI).
 * 25–35°C: neutral to mild increase.
 * Above 35°C: significant O3 formation (+3 AQI per degree above 35).
 */
export function temperatureImpact(tempC) {
  if (tempC < 25) return -2;
  if (tempC <= 35) return Math.round((tempC - 25) * 0.5);
  return Math.round(5 + (tempC - 35) * 3);
}

/**
 * Air pollutant components from OpenWeather API.
 * PM2.5 > 35 µg/m³ is the WHO threshold for unhealthy.
 * NO2 > 40 µg/m³ contributes to smog.
 * O3 > 100 µg/m³ is harmful.
 * CO > 4000 µg/m³ is dangerous.
 */
export function pollutantComponentImpact({ pm25 = 0, pm10 = 0, no2 = 0, o3 = 0, co = 0 }) {
  const pm25Delta = pm25 > 35 ? (pm25 - 35) * 0.4 : 0;
  const pm10Delta = pm10 > 50 ? (pm10 - 50) * 0.2 : 0;
  const no2Delta  = no2  > 40 ? (no2  - 40) * 0.3 : 0;
  const o3Delta   = o3   > 100 ? (o3  - 100) * 0.15 : 0;
  const coDelta   = co   > 4000 ? (co - 4000) * 0.002 : 0;
  return Math.round(pm25Delta + pm10Delta + no2Delta + o3Delta + coDelta);
}
