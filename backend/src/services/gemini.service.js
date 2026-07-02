import { GoogleGenerativeAI } from '@google/generative-ai'
import ApiError from '../utils/ApiError.js'

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    this.systemPrompt = `You are EcoSphere AI Assistant, an expert environmental and sustainability advisor. Your role is to:

1. Answer environmental questions with scientific accuracy
2. Provide actionable sustainability suggestions
3. Offer personalized carbon reduction advice
4. Raise pollution awareness and mitigation strategies
5. Promote eco-friendly lifestyle changes

Guidelines:
- Be concise yet informative (max 30 words per response)
- Use practical, implementable advice
- Include specific data and metrics when relevant
- Stay positive and encouraging about environmental action
- Focus on individual and community-level solutions
- Reference credible environmental science

Always maintain a helpful, professional, and optimistic tone while addressing serious environmental challenges.`
  }

  async chat(userMessage, conversationHistory = []) {
    try {
      const chat = this.model.startChat({
        history: this.formatHistory(conversationHistory),
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      })

      const result = await chat.sendMessage(
        `${this.systemPrompt}\n\nUser Query: ${userMessage}`,
      )

      const response = result.response
      const text = response.text()

      return {
        message: text,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new ApiError(
        500,
        'Failed to get response from environmental assistant',
      )
    }
  }

  async getEnvironmentalAdvice(category) {
    const prompts = {
      carbon: 'Provide 5 practical tips to reduce personal carbon footprint in daily life.',
      pollution: 'Explain the main sources of air pollution and how individuals can help reduce it.',
      sustainability: 'Suggest sustainable lifestyle changes that have the biggest environmental impact.',
      waste: 'Share effective waste reduction strategies and recycling best practices.',
      energy: 'Recommend energy-saving methods for homes and workplaces.',
      water: 'Provide water conservation techniques and their environmental benefits.',
    }

    const prompt = prompts[category] || prompts.sustainability

    try {
      const result = await this.model.generateContent(
        `${this.systemPrompt}\n\n${prompt}`,
      )
      const response = result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new ApiError(500, 'Failed to generate environmental advice')
    }
  }

  async analyzeCarbonFootprint(activities) {
    try {
      const prompt = `Analyze this carbon footprint data and provide:
1. Total estimated CO2 emissions
2. Breakdown by category
3. Top 3 reduction recommendations
4. Comparison to average person

Activities: ${JSON.stringify(activities, null, 2)}`

      const result = await this.model.generateContent(
        `${this.systemPrompt}\n\n${prompt}`,
      )
      const response = result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new ApiError(500, 'Failed to analyze carbon footprint')
    }
  }

  async getPollutionInsights(pollutionData) {
    try {
      const prompt = `Based on this air quality data, provide:
1. Health impact assessment
2. Safety recommendations
3. Vulnerable groups warnings
4. Pollution sources explanation

Data: ${JSON.stringify(pollutionData, null, 2)}`

      const result = await this.model.generateContent(
        `${this.systemPrompt}\n\n${prompt}`,
      )
      const response = result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new ApiError(500, 'Failed to get pollution insights')
    }
  }

  formatHistory(history) {
    return history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))
  }
}

export default new GeminiService()
