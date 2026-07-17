import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import apiClient from '../services/apiClient'

const CATEGORY_COLORS = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24', '#fb7185', '#60a5fa']

const initialForm = {
  transportation: {
    vehicleType: 'petrol_car',
    averageDistancePerDay: 25,
    domesticFlightsPerYear: 1,
    internationalFlightsPerYear: 0,
  },
  electricity: {
    monthlyKWh: 250,
    monthlyBillInr: '',
  },
  cooking: {
    fuelType: 'lpg',
  },
  food: {
    habit: 'mixed_diet',
  },
  waste: {
    plasticUsage: 'medium',
    recycles: true,
  },
  water: {
    litersPerDay: 135,
  },
}

const fieldGroups = [
  {
    title: 'Transportation',
    eyebrow: 'Mobility and flights',
    fields: [
      {
        type: 'select',
        section: 'transportation',
        name: 'vehicleType',
        label: 'Primary vehicle',
        options: [
          ['petrol_car', 'Petrol Car'],
          ['diesel_car', 'Diesel Car'],
          ['electric_vehicle', 'Electric Vehicle'],
          ['hybrid', 'Hybrid'],
          ['motorcycle', 'Motorcycle'],
          ['public_transport', 'Public Transport'],
          ['bicycle', 'Bicycle'],
          ['walking', 'Walking'],
        ],
      },
      { type: 'number', section: 'transportation', name: 'averageDistancePerDay', label: 'Average distance per day', suffix: 'km' },
      { type: 'number', section: 'transportation', name: 'domesticFlightsPerYear', label: 'Domestic flights per year' },
      { type: 'number', section: 'transportation', name: 'internationalFlightsPerYear', label: 'International flights per year' },
    ],
  },
  {
    title: 'Home Energy',
    eyebrow: 'Electricity and cooking',
    fields: [
      { type: 'number', section: 'electricity', name: 'monthlyKWh', label: 'Monthly electricity', suffix: 'kWh' },
      { type: 'number', section: 'electricity', name: 'monthlyBillInr', label: 'Monthly electricity bill', suffix: 'INR' },
      {
        type: 'select',
        section: 'cooking',
        name: 'fuelType',
        label: 'Cooking fuel',
        options: [
          ['lpg', 'LPG'],
          ['png', 'PNG'],
          ['electric', 'Electric'],
          ['induction', 'Induction'],
          ['wood', 'Wood'],
          ['coal', 'Coal'],
        ],
      },
    ],
  },
  {
    title: 'Lifestyle',
    eyebrow: 'Food, waste, and water',
    fields: [
      {
        type: 'select',
        section: 'food',
        name: 'habit',
        label: 'Food habit',
        options: [
          ['vegan', 'Vegan'],
          ['vegetarian', 'Vegetarian'],
          ['eggetarian', 'Eggetarian'],
          ['mixed_diet', 'Mixed Diet'],
          ['heavy_meat', 'Heavy Meat Consumption'],
        ],
      },
      {
        type: 'select',
        section: 'waste',
        name: 'plasticUsage',
        label: 'Plastic usage',
        options: [
          ['low', 'Low'],
          ['medium', 'Medium'],
          ['high', 'High'],
        ],
      },
      { type: 'toggle', section: 'waste', name: 'recycles', label: 'I recycle household waste' },
      { type: 'number', section: 'water', name: 'litersPerDay', label: 'Water consumed per day', suffix: 'litres' },
    ],
  },
]

const formatCategory = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-emerald-300/15 bg-white/[0.06] p-4 shadow-2xl shadow-emerald-950/20">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{helper}</p>
    </div>
  )
}

function ScoreRing({ score, label }) {
  const angle = Math.round((score / 100) * 360)

  return (
    <div className="flex items-center gap-5 rounded-xl border border-emerald-300/15 bg-white/[0.06] p-5">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#34d399 ${angle}deg, rgba(255,255,255,0.08) 0deg)` }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-950">
          <span className="text-3xl font-black text-emerald-300">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">Eco Score</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{label}</h3>
        <p className="mt-2 text-sm text-slate-300">Score is calculated from annual carbon intensity, recycling habits, and low-carbon mobility choices.</p>
      </div>
    </div>
  )
}

function CarbonCalculatorPage() {
  const [formData, setFormData] = useState(initialForm)
  const [activeGroup, setActiveGroup] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState('')

  const chartData = useMemo(() => {
    if (!result?.breakdown) return []
    return Object.entries(result.breakdown).map(([category, data]) => ({
      category: formatCategory(category),
      value: data.total,
      percentage: result.percentages?.[category] ?? 0,
    }))
  }, [result])

  const historyData = useMemo(
    () => history
      .slice()
      .reverse()
      .map((item) => ({
        label: new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        carbon: item.monthlyCarbonKg,
        score: item.ecoScore?.score,
      })),
    [history],
  )

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiClient.get('/carbon/history')
        setHistory(response.data.data || [])
      } catch (_err) {
        setHistory([])
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [])

  const updateField = (section, name, value, type) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
      },
    }))
  }

  const calculate = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        electricity: formData.electricity.monthlyKWh !== ''
          ? { monthlyKWh: Number(formData.electricity.monthlyKWh) }
          : { monthlyBillInr: Number(formData.electricity.monthlyBillInr || 0) },
      }
      const response = await apiClient.post('/carbon/calculate', payload)
      setResult(response.data.data)
      setHistory((prev) => [{ ...response.data.data, _id: response.data.data.reportId }, ...prev].slice(0, 24))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate carbon intelligence right now.')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!result) return

    const rows = chartData.map((item) => `<tr><td>${item.category}</td><td>${item.value} kg</td><td>${item.percentage}%</td></tr>`).join('')
    const recs = (result.aiAnalysis?.recommendations || [])
      .map((rec) => `<li><strong>${rec.title}</strong>: ${rec.detail}</li>`)
      .join('')
    const reportWindow = window.open('', '_blank', 'width=900,height=1000')

    reportWindow.document.write(`
      <html>
        <head>
          <title>EcoSphere Carbon Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            h1 { color: #047857; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <h1>EcoSphere AI Carbon Intelligence Report</h1>
          <p>Date of calculation: ${new Date(result.createdAt || Date.now()).toLocaleString()}</p>
          <div class="card"><strong>Monthly Carbon:</strong> ${result.monthlyCarbonKg} kg CO2e</div>
          <div class="card"><strong>Yearly Carbon:</strong> ${result.yearlyCarbonKg} kg CO2e</div>
          <div class="card"><strong>Eco Score:</strong> ${result.ecoScore.score}/100 - ${result.ecoScore.classification.label}</div>
          <h2>Carbon Breakdown</h2>
          <table><thead><tr><th>Category</th><th>Emissions</th><th>Contribution</th></tr></thead><tbody>${rows}</tbody></table>
          <h2>Environmental Equivalents</h2>
          <p>Trees needed: ${result.impact.treesNeededToOffset}</p>
          <p>Equivalent driving distance: ${result.impact.equivalentDrivingKm} km</p>
          <p>Household electricity equivalent: ${result.impact.householdElectricityKWh} kWh/month</p>
          <p>Coal burned equivalent: ${result.impact.coalBurnedKg} kg/year</p>
          <h2>AI Analysis</h2>
          <p>${result.aiAnalysis?.carbonSummary || ''}</p>
          <h2>Recommendations</h2>
          <ul>${recs}</ul>
          <h2>Monthly Goal</h2>
          <p>Reduce ${result.aiAnalysis?.monthlyReductionGoalKg || 0} kg CO2e next month.</p>
          <script>window.print()</script>
        </body>
      </html>
    `)
    reportWindow.document.close()
  }

  return (
    <div className="space-y-6 text-white">
      <section className="overflow-hidden rounded-2xl border border-emerald-300/15 bg-slate-950/60 p-6 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">AI Carbon Intelligence Calculator</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
              Premium sustainability analytics for everyday climate decisions.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Emissions are calculated with deterministic factors. Gemini is used only after calculation to explain patterns, goals, and recommendations.
            </p>
          </div>
          <button
            type="button"
            onClick={calculate}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generating intelligence...' : 'Calculate Carbon Intelligence'}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-5 backdrop-blur-xl">
          <div className="mb-5 grid grid-cols-3 gap-2">
            {fieldGroups.map((group, index) => (
              <button
                key={group.title}
                type="button"
                onClick={() => setActiveGroup(index)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                  activeGroup === index ? 'bg-emerald-400 text-slate-950' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                }`}
              >
                {group.title}
              </button>
            ))}
          </div>

          <motion.div
            key={fieldGroups[activeGroup].title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">{fieldGroups[activeGroup].eyebrow}</p>
              <h2 className="mt-1 text-2xl font-bold">{fieldGroups[activeGroup].title}</h2>
            </div>

            {fieldGroups[activeGroup].fields.map((field) => (
              <label key={`${field.section}-${field.name}`} className="block rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <span className="mb-2 block text-sm font-semibold text-slate-200">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.section][field.name]}
                    onChange={(event) => updateField(field.section, field.name, event.target.value, field.type)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none focus:border-emerald-300"
                  >
                    {field.options.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : null}
                {field.type === 'number' ? (
                  <div className="flex overflow-hidden rounded-lg border border-white/10 bg-slate-900 focus-within:border-emerald-300">
                    <input
                      type="number"
                      min="0"
                      value={formData[field.section][field.name]}
                      onChange={(event) => updateField(field.section, field.name, event.target.value, field.type)}
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none"
                    />
                    {field.suffix ? <span className="border-l border-white/10 px-3 py-3 text-sm text-slate-400">{field.suffix}</span> : null}
                  </div>
                ) : null}
                {field.type === 'toggle' ? (
                  <button
                    type="button"
                    onClick={() => updateField(field.section, field.name, !formData[field.section][field.name], field.type)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 font-semibold transition ${
                      formData[field.section][field.name] ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span>{formData[field.section][field.name] ? 'Yes' : 'No'}</span>
                    <span className="h-5 w-10 rounded-full bg-white/15 p-0.5">
                      <span className={`block h-4 w-4 rounded-full bg-white transition ${formData[field.section][field.name] ? 'translate-x-5' : ''}`} />
                    </span>
                  </button>
                ) : null}
              </label>
            ))}
          </motion.div>
        </section>

        <section className="space-y-6">
          {result ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard label="Monthly Carbon" value={`${result.monthlyCarbonKg} kg`} helper="CO2e per month" />
                <MetricCard label="Yearly Carbon" value={`${result.yearlyCarbonKg} kg`} helper="Projected annual footprint" />
                <MetricCard label="Largest Source" value={formatCategory(result.largestEmissionSource.category)} helper={`${result.largestEmissionSource.value} kg CO2e/month`} />
                <MetricCard label="AI Status" value={result.aiStatus === 'generated' ? 'Gemini' : 'Rule-based'} helper="Insight engine used" />
              </div>

              <ScoreRing score={result.ecoScore.score} label={result.ecoScore.classification.label} />

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-5">
                  <h3 className="mb-4 text-lg font-bold">Carbon Contribution</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="category" outerRadius={90} innerRadius={52}>
                        {chartData.map((entry, index) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-5">
                  <h3 className="mb-4 text-lg font-bold">Emission Comparison</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="category" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <MetricCard label="Trees" value={result.impact.treesNeededToOffset} helper="needed yearly" />
                <MetricCard label="Driving" value={`${result.impact.equivalentDrivingKm} km`} helper="petrol car equivalent" />
                <MetricCard label="Electricity" value={`${result.impact.householdElectricityKWh} kWh`} helper="monthly equivalent" />
                <MetricCard label="Coal" value={`${result.impact.coalBurnedKg} kg`} helper="burned yearly" />
                <MetricCard label="Phone Charges" value={result.impact.smartphoneCharges} helper="monthly equivalent" />
              </div>

              <div className="rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">Gemini Analysis</p>
                    <h3 className="mt-1 text-2xl font-bold">Personalized Carbon Plan</h3>
                    <p className="mt-3 max-w-3xl text-slate-300">{result.aiAnalysis?.carbonSummary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadReport}
                    className="rounded-xl border border-emerald-300/30 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/10"
                  >
                    Download PDF Report
                  </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {(result.aiAnalysis?.recommendations || []).slice(0, 3).map((rec) => (
                    <div key={rec.title} className="rounded-xl bg-slate-950/60 p-4">
                      <p className="font-bold text-emerald-200">{rec.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{rec.detail}</p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">
                        Save {rec.estimatedAnnualSavingsKg} kg/year
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-50">
                  Monthly reduction goal: <strong>{result.aiAnalysis?.monthlyReductionGoalKg} kg CO2e</strong>. {result.aiAnalysis?.motivationalMessage}
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-8 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Ready when you are</p>
                <h2 className="mt-3 text-3xl font-black">Complete the questionnaire and generate your intelligence report.</h2>
                <p className="mx-auto mt-3 max-w-xl text-slate-300">
                  Your report will include category emissions, an eco score, environmental equivalents, Gemini recommendations, and monthly tracking.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-emerald-300/15 bg-white/[0.05] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">Monthly History</p>
            <h2 className="mt-1 text-2xl font-bold">Carbon Trend</h2>
          </div>
          <p className="text-sm text-slate-400">{history.length} reports</p>
        </div>

        {historyLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/[0.06]" />
        ) : historyData.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={historyData}>
              <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="carbon" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-slate-300">
            No saved reports yet. Your first calculation will create the baseline.
          </div>
        )}
      </section>
    </div>
  )
}

export default CarbonCalculatorPage
