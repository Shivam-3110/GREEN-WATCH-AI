const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const classifyEcoScore = (score) => {
  if (score >= 90) return { label: 'Eco Warrior', tone: 'excellent' }
  if (score >= 75) return { label: 'Green Citizen', tone: 'good' }
  if (score >= 60) return { label: 'Average User', tone: 'average' }
  if (score >= 40) return { label: 'High Carbon User', tone: 'warning' }
  return { label: 'Critical Carbon Contributor', tone: 'critical' }
}

export const generateEcoScore = ({ monthlyCarbonKg, breakdown }) => {
  const annualCarbon = monthlyCarbonKg * 12
  const baselineAnnualKg = 6000
  const carbonScore = 100 - ((annualCarbon / baselineAnnualKg) * 60)
  const recyclingBonus = breakdown.waste?.details?.recycles ? 5 : 0
  const activeTravelBonus = ['walking', 'bicycle'].includes(breakdown.transportation?.details?.vehicleType) ? 8 : 0
  const score = Math.round(clamp(carbonScore + recyclingBonus + activeTravelBonus, 0, 100))

  return {
    score,
    classification: classifyEcoScore(score),
  }
}
