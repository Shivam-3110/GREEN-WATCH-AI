import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import axios from 'axios';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function CarbonCalculatorPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    vehicle: { car_petrol: 0, car_diesel: 0, car_electric: 0, motorcycle: 0, bus: 0, train: 0 },
    electricity: { kWh: 0, sourceType: 'grid_average' },
    food: { beef: 0, lamb: 0, pork: 0, chicken: 0, fish: 0, dairy: 0, eggs: 0, vegetables: 0, fruits: 0, grains: 0 },
    fuel: { petrol: 0, diesel: 0, lpg: 0, natural_gas: 0 }
  });

  const updateField = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: parseFloat(value) || 0 }
    }));
  };

  const calculateFootprint = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/carbon-footprint/calculate', {
        vehicleUsage: formData.vehicle,
        electricityUsage: formData.electricity,
        foodHabits: formData.food,
        fuelConsumption: formData.fuel
      });
      setResult(response.data.data);
      setStep(5);
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = { 'A+': '#10b981', 'A': '#22c55e', 'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444' };
    return colors[grade] || '#6b7280';
  };

  const chartData = result ? [
    { name: 'Vehicle', value: result.breakdown.vehicle.total, percentage: result.percentages.vehicle },
    { name: 'Electricity', value: result.breakdown.electricity.total, percentage: result.percentages.electricity },
    { name: 'Food', value: result.breakdown.food.total, percentage: result.percentages.food },
    { name: 'Fuel', value: result.breakdown.fuel.total, percentage: result.percentages.fuel }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Carbon Footprint Calculator</h1>
          <p className="text-gray-600">Calculate your environmental impact and get personalized recommendations</p>
        </motion.div>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between mb-2">
              {['Vehicle', 'Electricity', 'Food', 'Fuel'].map((label, idx) => (
                <span key={idx} className={`text-sm font-medium ${step > idx ? 'text-cyan-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🚗 Vehicle Usage (km/month)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.keys(formData.vehicle).map(key => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    value={formData.vehicle[key]}
                    onChange={(e) => updateField('vehicle', key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition">
              Next
            </button>
          </motion.div>
        )}

        {/* Step 2: Electricity */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚡ Electricity Usage</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly kWh</label>
                <input
                  type="number"
                  value={formData.electricity.kWh}
                  onChange={(e) => updateField('electricity', 'kWh', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="350"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Source</label>
                <select
                  value={formData.electricity.sourceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, electricity: { ...prev.electricity, sourceType: e.target.value } }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="grid_average">Grid Average</option>
                  <option value="coal">Coal</option>
                  <option value="natural_gas">Natural Gas</option>
                  <option value="renewable">Renewable</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition">
                Next
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Food */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🍽️ Food Habits (kg/month)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.keys(formData.food).map(key => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{key}</label>
                  <input
                    type="number"
                    value={formData.food[key]}
                    onChange={(e) => updateField('food', key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition">
                Back
              </button>
              <button onClick={() => setStep(4)} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition">
                Next
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Fuel */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⛽ Fuel Consumption</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.keys(formData.fuel).map(key => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace('_', ' ')} ({key === 'natural_gas' ? 'm³' : 'liters'}/month)
                  </label>
                  <input
                    type="number"
                    value={formData.fuel[key]}
                    onChange={(e) => updateField('fuel', key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(3)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition">
                Back
              </button>
              <button onClick={calculateFootprint} disabled={loading} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            {/* Eco Score */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
                style={{ backgroundColor: `${getGradeColor(result.sustainabilityLevel.grade)}20`, border: `4px solid ${getGradeColor(result.sustainabilityLevel.grade)}` }}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold" style={{ color: getGradeColor(result.sustainabilityLevel.grade) }}>
                    {result.sustainabilityLevel.grade}
                  </div>
                  <div className="text-xs text-gray-600">{result.sustainabilityLevel.level}</div>
                </div>
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{result.carbonFootprintScore} kg CO2e</h2>
              <p className="text-gray-600">{result.sustainabilityLevel.description}</p>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Emissions Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.percentage}%`}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Category Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">🌍 Environmental Impact</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl mb-2">🌳</div>
                  <div className="text-2xl font-bold text-green-600">{result.environmentalImpact.treesNeededToOffset}</div>
                  <div className="text-sm text-gray-600">Trees to Offset</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl mb-2">🚗</div>
                  <div className="text-2xl font-bold text-blue-600">{result.environmentalImpact.equivalentCarsPerYear}</div>
                  <div className="text-sm text-gray-600">Cars/Year</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-3xl mb-2">🌎</div>
                  <div className="text-2xl font-bold text-purple-600">{result.environmentalImpact.earthsRequired}</div>
                  <div className="text-sm text-gray-600">Earths Required</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-orange-600">{result.environmentalImpact.comparisonToGlobalAverage}</div>
                  <div className="text-sm text-gray-600">vs Global Avg</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">💡 Personalized Recommendations</h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200"
                  >
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${rec.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {rec.priority}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{rec.category}</h4>
                      <p className="text-sm text-gray-600 mb-2">{rec.suggestion}</p>
                      <p className="text-xs font-medium text-green-600">Potential savings: {rec.potentialSavings}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <button onClick={() => { setStep(1); setResult(null); }} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-medium hover:shadow-lg transition">
              Calculate Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
