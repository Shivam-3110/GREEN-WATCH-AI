import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import geminiService from '../services/gemini.service.js'

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message, conversationHistory } = req.body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required')
  }

  if (message.length > 1000) {
    throw new ApiError(400, 'Message too long (max 1000 characters)')
  }

  const history = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-10)
    : []

  const response = await geminiService.chat(message.trim(), history)

  res.status(200).json({
    success: true,
    data: {
      response: response.message,
      timestamp: response.timestamp,
      query: message.trim(),
    },
  })
})

export const getAdviceByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params

  const validCategories = [
    'carbon',
    'pollution',
    'sustainability',
    'waste',
    'energy',
    'water',
  ]

  if (!validCategories.includes(category)) {
    throw new ApiError(
      400,
      `Invalid category. Must be one of: ${validCategories.join(', ')}`,
    )
  }

  const advice = await geminiService.getEnvironmentalAdvice(category)

  res.status(200).json({
    success: true,
    data: {
      category,
      advice,
      timestamp: new Date().toISOString(),
    },
  })
})

export const analyzeCarbonFootprint = asyncHandler(async (req, res) => {
  const { activities } = req.body

  if (!activities || typeof activities !== 'object') {
    throw new ApiError(400, 'Activities data is required')
  }

  const analysis = await geminiService.analyzeCarbonFootprint(activities)

  res.status(200).json({
    success: true,
    data: {
      analysis,
      timestamp: new Date().toISOString(),
    },
  })
})

export const getPollutionInsights = asyncHandler(async (req, res) => {
  const { pollutionData } = req.body

  if (!pollutionData || typeof pollutionData !== 'object') {
    throw new ApiError(400, 'Pollution data is required')
  }

  const insights = await geminiService.getPollutionInsights(pollutionData)

  res.status(200).json({
    success: true,
    data: {
      insights,
      timestamp: new Date().toISOString(),
    },
  })
})

export const getQuickTips = asyncHandler(async (_req, res) => {
  const tips = [
    {
      category: 'Energy',
      tip: 'Switch to LED bulbs to reduce energy consumption by up to 75%',
      impact: 'high',
    },
    {
      category: 'Transport',
      tip: 'Use public transport or carpool to cut carbon emissions significantly',
      impact: 'high',
    },
    {
      category: 'Waste',
      tip: 'Compost organic waste to reduce landfill methane emissions',
      impact: 'medium',
    },
    {
      category: 'Water',
      tip: 'Fix leaky faucets to save up to 3,000 gallons of water per year',
      impact: 'medium',
    },
    {
      category: 'Food',
      tip: 'Reduce meat consumption by one meal per week to lower your carbon footprint',
      impact: 'high',
    },
  ]

  res.status(200).json({
    success: true,
    data: {
      tips,
      count: tips.length,
    },
  })
})
