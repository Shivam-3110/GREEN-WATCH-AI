import CarbonHistory from '../models/CarbonHistory.model.js'
import CarbonProfile from '../models/CarbonProfile.model.js'
import User from '../models/User.model.js'
import { calculateCarbonFootprint } from '../services/CarbonCalculator.js'
import { generateEcoScore } from '../services/EcoScoreEngine.js'
import { convertCarbonImpact } from '../services/ImpactConverter.js'
import geminiService from '../services/gemini.service.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const buildFallbackAnalysis = ({ breakdown, monthlyCarbonKg, ecoScore, largestEmissionSource }) => ({
  carbonSummary: `Your estimated footprint is ${monthlyCarbonKg} kg CO2e per month. ${largestEmissionSource.category} is currently your largest source.`,
  topEmissionSources: Object.entries(breakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)
    .map(([category, value]) => `${category}: ${value.total} kg CO2e/month`),
  strengths: [
    ecoScore.score >= 75 ? 'Your lifestyle is already performing better than many high-emission profiles.' : 'You now have a clear baseline to improve from.',
    'Tracking emissions monthly makes reduction goals easier to act on.',
  ],
  areasForImprovement: [
    'Reduce the largest category first for the fastest impact.',
    'Shift recurring habits such as travel, diet, and power use gradually.',
    'Review progress every month instead of treating this as a one-time report.',
  ],
  recommendations: [
    {
      title: 'Focus on the largest source',
      detail: `Start with ${largestEmissionSource.category}, because it contributes the most to your monthly emissions.`,
      estimatedAnnualSavingsKg: Math.round(largestEmissionSource.value * 12 * 0.2),
    },
  ],
  monthlyReductionGoalKg: Math.max(10, Math.round(monthlyCarbonKg * 0.08)),
  motivationalMessage: 'Small, consistent reductions compound into a serious climate win over the year.',
})

const getUserId = (req) => req.user?.userId

export const calculateCarbon = asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const lifestyle = req.body
  const footprint = calculateCarbonFootprint(lifestyle)
  const ecoScore = generateEcoScore(footprint)
  const impact = convertCarbonImpact(footprint)
  const calculatedValues = {
    transportation: footprint.breakdown.transportation.total,
    electricity: footprint.breakdown.electricity.total,
    cooking: footprint.breakdown.cooking.total,
    food: footprint.breakdown.food.total,
    waste: footprint.breakdown.waste.total,
    water: footprint.breakdown.water.total,
    monthlyCarbon: footprint.monthlyCarbonKg,
    yearlyCarbon: footprint.yearlyCarbonKg,
    ecoScore: ecoScore.score,
    carbonCategory: ecoScore.classification.label,
  }

  let aiStatus = 'generated'
  let aiAnalysis

  try {
    aiAnalysis = await geminiService.generateCarbonIntelligence(calculatedValues)
  } catch (_error) {
    aiStatus = 'fallback'
    aiAnalysis = buildFallbackAnalysis({ ...footprint, ecoScore })
  }

  const history = await CarbonHistory.create({
    user: userId,
    lifestyle,
    ...footprint,
    ecoScore,
    impact,
    aiAnalysis,
    aiStatus,
  })

  await CarbonProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      latestLifestyle: lifestyle,
      latestEcoScore: ecoScore.score,
      latestMonthlyCarbonKg: footprint.monthlyCarbonKg,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  res.status(201).json({
    success: true,
    data: {
      reportId: history._id,
      ...footprint,
      ecoScore,
      impact,
      aiAnalysis,
      aiStatus,
      createdAt: history.createdAt,
    },
  })
})

export const getCarbonHistory = asyncHandler(async (req, res) => {
  const history = await CarbonHistory.find({ user: getUserId(req) })
    .sort({ createdAt: -1 })
    .limit(24)
    .lean()

  res.status(200).json({ success: true, data: history })
})

export const getCarbonReport = asyncHandler(async (req, res) => {
  const report = await CarbonHistory.findOne({
    _id: req.params.id,
    user: getUserId(req),
  }).lean()

  if (!report) {
    throw new ApiError(404, 'Carbon report not found')
  }

  const user = await User.findById(getUserId(req)).select('name email profile').lean()

  res.status(200).json({
    success: true,
    data: {
      report,
      user: user ? { name: user.name, email: user.email, location: user.profile?.locationName } : null,
    },
  })
})

export const deleteCarbonHistory = asyncHandler(async (req, res) => {
  const deleted = await CarbonHistory.findOneAndDelete({
    _id: req.params.id,
    user: getUserId(req),
  })

  if (!deleted) {
    throw new ApiError(404, 'Carbon report not found')
  }

  res.status(200).json({ success: true, message: 'Carbon report deleted' })
})
