/**
 * AI Environmental Assistant API Test Examples
 * 
 * Before running:
 * 1. Ensure backend server is running (npm run dev)
 * 2. Set your JWT token below
 * 3. Add GEMINI_API_KEY to backend/.env
 */

const API_BASE = 'http://localhost:5000/api/v1'
const JWT_TOKEN = 'your_jwt_token_here' // Get this from login response

// Test 1: Chat with Assistant
async function testChat() {
  console.log('Testing Chat with Assistant...')
  
  const response = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({
      message: 'What are the top 3 ways to reduce my carbon footprint?',
      conversationHistory: []
    })
  })

  const data = await response.json()
  console.log('Response:', data)
  console.log('\n')
}

// Test 2: Get Category-Specific Advice
async function testAdvice() {
  console.log('Testing Category Advice...')
  
  const categories = ['carbon', 'pollution', 'waste']
  
  for (const category of categories) {
    const response = await fetch(`${API_BASE}/assistant/advice/${category}`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    })

    const data = await response.json()
    console.log(`${category.toUpperCase()} Advice:`, data.data.advice)
    console.log('\n')
  }
}

// Test 3: Analyze Carbon Footprint
async function testCarbonAnalysis() {
  console.log('Testing Carbon Footprint Analysis...')
  
  const response = await fetch(`${API_BASE}/assistant/carbon-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({
      activities: {
        transport: {
          carMiles: 500,
          flights: 2,
          publicTransport: true
        },
        energy: {
          electricityKwh: 300,
          gasTherm: 50,
          renewablePercent: 20
        },
        food: {
          meatMealsPerWeek: 10,
          localFoodPercent: 30
        }
      }
    })
  })

  const data = await response.json()
  console.log('Carbon Analysis:', data.data.analysis)
  console.log('\n')
}

// Test 4: Get Pollution Insights
async function testPollutionInsights() {
  console.log('Testing Pollution Insights...')
  
  const response = await fetch(`${API_BASE}/assistant/pollution-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({
      pollutionData: {
        location: 'Delhi',
        aqi: 185,
        pm25: 95,
        pm10: 150,
        no2: 45,
        o3: 30
      }
    })
  })

  const data = await response.json()
  console.log('Pollution Insights:', data.data.insights)
  console.log('\n')
}

// Test 5: Get Quick Tips
async function testQuickTips() {
  console.log('Testing Quick Tips...')
  
  const response = await fetch(`${API_BASE}/assistant/quick-tips`, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  })

  const data = await response.json()
  console.log('Quick Tips:', data.data.tips)
  console.log('\n')
}

// Test 6: Multi-turn Conversation
async function testConversation() {
  console.log('Testing Multi-turn Conversation...')
  
  const conversationHistory = []

  // First message
  let response = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({
      message: 'Tell me about solar energy benefits',
      conversationHistory
    })
  })

  let data = await response.json()
  conversationHistory.push(
    { role: 'user', content: 'Tell me about solar energy benefits' },
    { role: 'assistant', content: data.data.response }
  )
  console.log('Turn 1:', data.data.response)

  // Second message with context
  response = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({
      message: 'How much would it cost to install?',
      conversationHistory
    })
  })

  data = await response.json()
  console.log('Turn 2:', data.data.response)
  console.log('\n')
}

// Run all tests
async function runAllTests() {
  try {
    await testQuickTips() // No Gemini API needed
    
    // Uncomment below after adding GEMINI_API_KEY
    // await testChat()
    // await testAdvice()
    // await testCarbonAnalysis()
    // await testPollutionInsights()
    // await testConversation()
    
  } catch (error) {
    console.error('Test Error:', error.message)
  }
}

// Uncomment to run tests
// runAllTests()

export {
  testChat,
  testAdvice,
  testCarbonAnalysis,
  testPollutionInsights,
  testQuickTips,
  testConversation
}
