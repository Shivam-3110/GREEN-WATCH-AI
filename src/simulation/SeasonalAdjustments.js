const DEFAULT_SEASONAL_RULES = {
  winter: 15,
  summer: 5,
  monsoon: -10,
  spring: -2,
}

const getNorthernIndiaSeason = (monthIndex) => {
  if ([11, 0, 1].includes(monthIndex)) return 'winter'
  if ([2, 3].includes(monthIndex)) return 'spring'
  if ([4, 5].includes(monthIndex)) return 'summer'
  if ([6, 7, 8].includes(monthIndex)) return 'monsoon'
  return 'winter'
}

export function getSeasonalAdjustment(date = new Date(), rules = DEFAULT_SEASONAL_RULES) {
  const season = getNorthernIndiaSeason(date.getMonth())
  return {
    season,
    delta: rules[season] ?? 0,
  }
}

export function getFutureMonthSeasonalAdjustments(monthCount = 6, startDate = new Date(), rules = DEFAULT_SEASONAL_RULES) {
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(startDate)
    date.setMonth(startDate.getMonth() + index + 1)
    return {
      month: `Month ${index + 1}`,
      ...getSeasonalAdjustment(date, rules),
    }
  })
}

export { DEFAULT_SEASONAL_RULES }
