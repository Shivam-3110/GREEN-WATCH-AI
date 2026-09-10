import { useEffect, useMemo, useState } from 'react'
import { animate, motion } from 'framer-motion'
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

const CATEGORY_COLORS = ['#34d399', '#22d3ee', '#8b5cf6', '#f59e0b', '#f43f5e', '#60a5fa']

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
    eyebrow: 'Mobility profile',
    description: 'Daily distance, primary vehicle, and flight habits.',
    icon: 'route',
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
    title: 'Electricity',
    eyebrow: 'Home energy',
    description: 'Use either consumption or your monthly bill estimate.',
    icon: 'bolt',
    fields: [
      { type: 'number', section: 'electricity', name: 'monthlyKWh', label: 'Monthly electricity', suffix: 'kWh' },
      { type: 'number', section: 'electricity', name: 'monthlyBillInr', label: 'Monthly electricity bill', suffix: 'INR' },
    ],
  },
  {
    title: 'Food',
    eyebrow: 'Diet pattern',
    description: 'Your regular food habit for carbon intensity.',
    icon: 'leaf',
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
    ],
  },
  {
    title: 'Waste',
    eyebrow: 'Material footprint',
    description: 'Plastic usage and recycling behavior.',
    icon: 'recycle',
    fields: [
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
    ],
  },
  {
    title: 'Water',
    eyebrow: 'Daily usage',
    description: 'Estimated household water consumption per person.',
    icon: 'drop',
    fields: [
      { type: 'number', section: 'water', name: 'litersPerDay', label: 'Water consumed per day', suffix: 'litres' },
    ],
  },
  {
    title: 'Cooking Fuel',
    eyebrow: 'Kitchen energy',
    description: 'Primary cooking fuel used at home.',
    icon: 'flame',
    fields: [
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
]

const iconPaths = {
  route: (
    <>
      <path d="M6 18c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" />
      <path d="M18 12c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" />
      <path d="M8.3 13.1 15.7 10" />
    </>
  ),
  bolt: <path d="M13 2 5 14h6l-1 8 9-13h-6l0-7Z" />,
  leaf: (
    <>
      <path d="M5 19c9 0 14-5 14-14v0h-4C8 5 5 8 5 15v4Z" />
      <path d="M5 19c3-6 7-9 14-14" />
    </>
  ),
  recycle: (
    <>
      <path d="m7 7 2-4 2 4" />
      <path d="M9 3v7" />
      <path d="m17 10 4 2-4 2" />
      <path d="M21 12h-7" />
      <path d="m7 17-4-2 4-2" />
      <path d="M3 15h7" />
    </>
  ),
  drop: <path d="M12 21c-3.3 0-6-2.5-6-5.8C6 11.4 12 3 12 3s6 8.4 6 12.2c0 3.3-2.7 5.8-6 5.8Z" />,
  flame: <path d="M12 22c-3.9 0-7-2.9-7-6.7 0-2.7 1.4-5 4.1-7C10.7 7 12 5.2 12 2c4 2.5 7 6.4 7 12 0 4.5-3.1 8-7 8Z" />,
  calendar: (
    <>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 9h16" />
      <path d="M5 5h14v16H5z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2v6" />
      <path d="M12 16v6" />
      <path d="M2 12h6" />
      <path d="M16 12h6" />
      <path d="m5 5 4 4" />
      <path d="m15 15 4 4" />
      <path d="m19 5-4 4" />
      <path d="m9 15-4 4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
}

const formatCategory = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const getDynamicTip = (activeGroup, formData) => {
  const tips = [
    formData.transportation.vehicleType === 'public_transport' || formData.transportation.vehicleType === 'bicycle' || formData.transportation.vehicleType === 'walking'
      ? 'Your mobility profile is already leaning low-carbon. Keep daily short trips car-light where possible.'
      : 'Transport usually responds fastest to small changes: one low-car day per week can shift your monthly footprint.',
    formData.electricity.monthlyKWh > 300
      ? 'Your electricity usage looks like a strong reduction opportunity. Start with cooling, standby loads, and efficient lighting.'
      : 'Your electricity profile is measured. Rooftop solar or green supply can make the next improvement meaningful.',
    formData.food.habit === 'vegan' || formData.food.habit === 'vegetarian'
      ? 'Plant-forward diets typically carry a lower carbon load. Focus on reducing food waste for the next gain.'
      : 'Swapping a few meat-heavy meals for plant-forward meals is one of the simplest lifestyle carbon wins.',
    formData.waste.recycles
      ? 'Recycling is active in your profile. The next step is reducing single-use purchases before they become waste.'
      : 'Starting a simple dry-waste separation routine can improve both emissions and your eco score.',
    formData.water.litersPerDay > 160
      ? 'Water use is above the common urban baseline. Low-flow fixtures and shorter high-flow routines can help.'
      : 'Your water estimate is controlled. Keep an eye on leaks, because small leaks quietly add up.',
    formData.cooking.fuelType === 'induction' || formData.cooking.fuelType === 'electric'
      ? 'Electric cooking pairs well with cleaner electricity. It is a good foundation for long-term reductions.'
      : 'Cleaner cooking upgrades can reduce household emissions while improving indoor air quality.',
  ]

  return tips[activeGroup] || tips[0]
}

const getLiveCarbonPreview = (formData) => {
  const distance = Number(formData.transportation.averageDistancePerDay) || 0
  const electricity = Number(formData.electricity.monthlyKWh) || 0
  const water = Number(formData.water.litersPerDay) || 0
  const transportLoad = distance > 35 ? 'High' : distance > 12 ? 'Moderate' : 'Low'
  const energyLoad = electricity > 320 ? 'High' : electricity > 160 ? 'Moderate' : 'Low'
  const lifestyleSignal = formData.food.habit === 'heavy_meat' || formData.waste.plasticUsage === 'high' ? 'Elevated' : 'Balanced'

  return {
    transportLoad,
    energyLoad,
    lifestyleSignal,
    estimate: Math.round((distance * 6.5) + (electricity * 0.7) + (water * 0.08)),
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] || iconPaths.spark}
    </svg>
  )
}

function AnimatedNumber({ value, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const numericValue = Number(value) || 0

  useEffect(() => {
    const controls = animate(0, numericValue, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(latest),
    })

    return () => controls.stop()
  }, [numericValue])

  return (
    <span>
      {display.toLocaleString('en-IN', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

function SectionShell({ eyebrow, title, description, children, action, className = '' }) {
  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className={`space-y-5 ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  )
}

function HeroSection({ activeGroup }) {
  const completion = Math.round(((activeGroup + 1) / fieldGroups.length) * 100)

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#07111f]/80 px-6 py-7 shadow-2xl shadow-black/25 backdrop-blur-2xl md:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#48E5C2]/70 to-transparent" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-white md:text-[40px]">Carbon Calculator</h1>
          <p className="mt-2 text-base text-slate-300">Calculate your monthly carbon footprint.</p>
        </div>
        <div className="w-full lg:max-w-xs">
          <div className="flex items-center justify-between text-[13px] font-medium">
            <span className="text-slate-400">Progress</span>
            <span className="text-[#48E5C2]">{completion}% Complete</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-gradient-to-r from-[#48E5C2] to-[#2BC9F4]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FieldControl({ field, formData, updateField }) {
  const value = formData[field.section][field.name]

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{field.label}</span>
      {field.type === 'select' ? (
        <select
          value={value}
          onChange={(event) => updateField(field.section, field.name, event.target.value, field.type)}
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#081322]/90 px-4 text-sm text-white shadow-inner shadow-black/20 outline-none transition hover:border-white/[0.14] focus:border-[#48E5C2] focus:ring-2 focus:ring-[#48E5C2]/30"
        >
          {field.options.map(([optionValue, label]) => (
            <option key={optionValue} value={optionValue}>{label}</option>
          ))}
        </select>
      ) : null}

      {field.type === 'number' ? (
        <div className="flex h-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#081322]/90 shadow-inner shadow-black/20 transition hover:border-white/[0.14] focus-within:border-[#48E5C2] focus-within:ring-2 focus-within:ring-[#48E5C2]/30">
          <input
            type="number"
            min="0"
            value={value}
            onChange={(event) => updateField(field.section, field.name, event.target.value, field.type)}
            className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none"
          />
          {field.suffix ? <span className="grid place-items-center border-l border-white/[0.06] px-4 text-[13px] text-slate-500">{field.suffix}</span> : null}
        </div>
      ) : null}

      {field.type === 'toggle' ? (
        <button
          type="button"
          onClick={() => updateField(field.section, field.name, !value, field.type)}
          className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold shadow-inner shadow-black/20 transition focus-visible:ring-2 focus-visible:ring-[#48E5C2]/40 ${
            value ? 'border-[#48E5C2]/40 bg-[#48E5C2]/12 text-[#CFFFF5]' : 'border-white/[0.08] bg-[#081322]/90 text-slate-300 hover:border-white/[0.14]'
          }`}
        >
          <span>{value ? 'Yes, I recycle' : 'No regular recycling'}</span>
          <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${value ? 'bg-[#48E5C2]' : 'bg-white/15'}`}>
            <span className={`block h-4 w-4 rounded-full bg-slate-950 transition ${value ? 'translate-x-5' : ''}`} />
          </span>
        </button>
      ) : null}
    </label>
  )
}

function QuestionnaireCard({ activeGroup, setActiveGroup, formData, updateField, calculate, loading }) {
  const group = fieldGroups[activeGroup]
  const atFirst = activeGroup === 0
  const atLast = activeGroup === fieldGroups.length - 1

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-3 shadow-2xl shadow-black/20 backdrop-blur-2xl md:p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fieldGroups.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveGroup(index)}
              className={`group flex min-w-max items-center gap-2 rounded-full border px-3.5 py-2.5 text-left text-sm font-semibold transition duration-200 focus-visible:ring-2 focus-visible:ring-[#48E5C2]/50 ${
                activeGroup === index
                  ? 'border-[#48E5C2]/40 bg-white text-slate-950 shadow-lg shadow-[#48E5C2]/10'
                  : index < activeGroup
                    ? 'border-[#48E5C2]/20 bg-[#48E5C2]/10 text-[#BFFFF2] hover:bg-[#48E5C2]/15'
                    : 'border-white/[0.08] bg-[#07111f]/70 text-slate-400 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${activeGroup === index ? 'bg-[#48E5C2]/20 text-emerald-700' : 'bg-white/[0.08] text-[#48E5C2]'}`}>
                {index < activeGroup ? <span className="text-sm leading-none">&#10003;</span> : <Icon name={item.icon} className="h-4 w-4" />}
              </span>
              <span className="min-w-0 truncate">{item.title}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 rounded-[18px] border border-white/[0.08] bg-[#07111f]/80 p-6 shadow-inner shadow-black/20 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#48E5C2]/12 text-[#48E5C2] ring-1 ring-[#48E5C2]/20">
                  <Icon name={group.icon} />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-slate-500">Step {activeGroup + 1} of {fieldGroups.length}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{group.title}</h2>
                </div>
              </div>
            </div>
            <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] font-medium text-slate-400">
              {Math.round(((activeGroup + 1) / fieldGroups.length) * 100)}%
            </span>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {group.fields.map((field) => (
              <FieldControl key={`${field.section}-${field.name}`} field={field} formData={formData} updateField={updateField} />
            ))}
          </div>

          <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex flex-col gap-3 border-t border-white/[0.08] bg-[#07111f]/95 px-6 py-4 backdrop-blur-xl md:static md:z-auto md:mx-0 md:flex-row md:items-center md:justify-between md:bg-transparent md:px-0 md:pb-0 md:pt-6 md:backdrop-blur-0">
            <div className="grid grid-cols-2 gap-3 md:flex">
              <button
                type="button"
                onClick={() => setActiveGroup((prev) => Math.max(prev - 1, 0))}
                disabled={atFirst}
                className="rounded-full border border-white/[0.1] bg-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/[0.18] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {!atLast ? (
                <motion.button
                  type="button"
                  onClick={() => setActiveGroup((prev) => Math.min(prev + 1, fieldGroups.length - 1))}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-gradient-to-r from-[#48E5C2] to-[#2BC9F4] px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#48E5C2]/20 transition"
                >
                  Next
                </motion.button>
              ) : null}
            </div>
            {atLast ? (
              <motion.button
                type="button"
                onClick={calculate}
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-full bg-gradient-to-r from-[#48E5C2] to-[#2BC9F4] px-8 py-3.5 text-sm font-bold text-slate-950 shadow-2xl shadow-[#48E5C2]/20 transition disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {loading ? 'Generating Report...' : 'Generate Report'}
              </motion.button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function SummaryCards({ result }) {
  const cards = [
    { label: 'Monthly Carbon', value: result.monthlyCarbonKg, suffix: ' kg', helper: 'CO2e per month', icon: 'calendar' },
    { label: 'Yearly Carbon', value: result.yearlyCarbonKg, suffix: ' kg', helper: 'Projected annual footprint', icon: 'chart' },
    { label: 'Eco Score', value: result.ecoScore.score, suffix: '/100', helper: result.ecoScore.classification.label, icon: 'target' },
    {
      label: 'Largest Emission Source',
      textValue: formatCategory(result.largestEmissionSource.category),
      helper: `${result.largestEmissionSource.value} kg CO2e/month`,
      icon: 'spark',
    },
  ]

  return (
    <SectionShell eyebrow="Results Overview" title="Your footprint at a glance" description="Four essentials only, tuned for quick scanning.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.06, duration: 0.4 }}
            className="rounded-2xl bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20 ring-1 ring-white/[0.06]"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/12 text-emerald-200">
                <Icon name={card.icon} />
              </span>
            </div>
            <p className="mt-5 min-h-16 text-3xl font-semibold tracking-tight text-white">
              {card.textValue || <AnimatedNumber value={card.value} suffix={card.suffix} />}
            </p>
            <p className="mt-2 text-sm text-slate-400">{card.helper}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl bg-slate-950/95 px-4 py-3 text-sm shadow-xl ring-1 ring-white/10">
      <p className="font-semibold text-white">{label || payload[0].name}</p>
      <p className="mt-1 text-emerald-200">{payload[0].value} kg CO2e</p>
    </div>
  )
}

function AnalyticsSection({ chartData }) {
  return (
    <SectionShell eyebrow="Carbon Analytics" title="Category distribution" description="A dedicated chart space makes the carbon story easier to read.">
      <div className="grid gap-5 xl:grid-cols-2">
        <motion.div className="rounded-2xl bg-white/[0.055] p-6 shadow-xl shadow-slate-950/20 ring-1 ring-white/[0.07]" whileHover={{ y: -2 }}>
          <h3 className="text-lg font-semibold text-white">Contribution Mix</h3>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="category" outerRadius={118} innerRadius={66} paddingAngle={3} animationDuration={900}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="rounded-2xl bg-white/[0.055] p-6 shadow-xl shadow-slate-950/20 ring-1 ring-white/[0.07]" whileHover={{ y: -2 }}>
          <h3 className="text-lg font-semibold text-white">Emission Comparison</h3>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} animationDuration={900}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  )
}

function ImpactCards({ impact }) {
  const cards = [
    { label: 'Trees Needed', value: impact.treesNeededToOffset, helper: 'to offset annually', icon: 'leaf' },
    { label: 'Driving Equivalent', value: impact.equivalentDrivingKm, suffix: ' km', helper: 'petrol car distance', icon: 'route' },
    { label: 'Coal Burned', value: impact.coalBurnedKg, suffix: ' kg', helper: 'annual equivalent', icon: 'flame' },
    { label: 'Electricity Equivalent', value: impact.householdElectricityKWh, suffix: ' kWh', helper: 'monthly household use', icon: 'bolt' },
  ]

  return (
    <SectionShell eyebrow="Environmental Impact" title="Real-world equivalents" description="Carbon numbers translated into everyday environmental impact.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-slate-950/40 p-5 shadow-lg shadow-slate-950/15 ring-1 ring-white/[0.06]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
              <Icon name={card.icon} />
            </span>
            <p className="mt-5 text-sm font-medium text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              <AnimatedNumber value={card.value} suffix={card.suffix || ''} />
            </p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function StickyCarbonSummaryPanel({ activeGroup, formData }) {
  const completion = Math.round(((activeGroup + 1) / fieldGroups.length) * 100)
  const preview = getLiveCarbonPreview(formData)
  const tip = getDynamicTip(activeGroup, formData)

  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-6 space-y-5 rounded-[20px] border border-white/[0.08] bg-[#07111f]/80 p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl"
    >
      <div>
        <p className="text-[13px] font-medium text-slate-400">Monthly Estimate</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
          <AnimatedNumber value={preview.estimate} suffix=" kg" />
        </p>
        <p className="mt-1 text-[13px] text-slate-500">CO2e preview from current inputs</p>
      </div>

      <div className="h-px bg-white/[0.08]" />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Eco Score</span>
          <span className="text-sm font-semibold text-white">Complete to generate</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Largest Source</span>
          <span className="text-sm font-semibold text-white">{fieldGroups[activeGroup].title}</span>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Completion</span>
            <span className="text-sm font-semibold text-[#48E5C2]">{completion}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.35 }}
              className="h-full rounded-full bg-gradient-to-r from-[#48E5C2] to-[#2BC9F4]"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
          <p className="text-[13px] text-slate-500">Complete the questionnaire to generate insights.</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.08]" />

      <div className="rounded-2xl border border-[#48E5C2]/15 bg-gradient-to-br from-[#48E5C2]/12 to-[#2BC9F4]/10 p-4">
        <p className="text-sm font-semibold text-[#CFFFF5]">Today's Tip</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{tip}</p>
      </div>

      <div className="grid gap-2 text-[13px] text-slate-400">
        <div className="flex justify-between"><span>Transport</span><span className="text-slate-200">{preview.transportLoad}</span></div>
        <div className="flex justify-between"><span>Energy</span><span className="text-slate-200">{preview.energyLoad}</span></div>
        <div className="flex justify-between"><span>Lifestyle</span><span className="text-slate-200">{preview.lifestyleSignal}</span></div>
      </div>
    </motion.aside>
  )
}

function StickyAIInsightsPanel({ result, downloadReport }) {
  const recommendations = result.aiAnalysis?.recommendations || []

  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-6 space-y-4 rounded-3xl bg-white/[0.065] p-5 shadow-2xl shadow-slate-950/30 ring-1 ring-white/[0.08] backdrop-blur-2xl"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">AI Insights</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Reduction plan</h2>
      </div>

      <div className="rounded-2xl bg-slate-950/45 p-4">
        <p className="text-sm font-medium text-emerald-200">Carbon Summary</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{result.aiAnalysis?.carbonSummary || 'Your calculated profile is ready for review.'}</p>
      </div>

      <div className="rounded-2xl bg-slate-950/45 p-4">
        <p className="text-xs font-medium text-slate-500">Top Emission Source</p>
        <p className="mt-2 text-2xl font-semibold text-white">{formatCategory(result.largestEmissionSource.category)}</p>
        <p className="mt-1 text-sm text-slate-400">{result.largestEmissionSource.value} kg CO2e/month</p>
      </div>

      <div className="rounded-2xl bg-slate-950/45 p-4">
        <p className="text-sm font-medium text-cyan-100">Personalized Recommendations</p>
        <div className="mt-3 space-y-3">
          {recommendations.slice(0, 3).map((rec) => (
            <div key={rec.title} className="rounded-xl bg-white/[0.055] p-3">
              <p className="text-sm font-semibold text-white">{rec.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{rec.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-300/14 to-cyan-300/10 p-4">
        <p className="text-sm font-medium text-emerald-100">Monthly Goal</p>
        <p className="mt-2 text-3xl font-semibold text-white">
          <AnimatedNumber value={result.aiAnalysis?.monthlyReductionGoalKg || 0} suffix=" kg" />
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{result.aiAnalysis?.motivationalMessage}</p>
      </div>

      <motion.button
        type="button"
        onClick={downloadReport}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/15"
      >
        <Icon name="download" className="h-4 w-4" />
        Download Report
      </motion.button>
    </motion.aside>
  )
}

function AnalyticsDashboard({ result, chartData, historyLoading, historyData, history }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-9"
    >
      <SummaryCards result={result} />
      <AnalyticsSection chartData={chartData} />
      <ImpactCards impact={result.impact} />
      <HistoryChart historyLoading={historyLoading} historyData={historyData} history={history} />
    </motion.div>
  )
}

function HistoryChart({ historyLoading, historyData, history }) {
  return (
    <SectionShell
      eyebrow="Carbon History"
      title="Monthly trend and previous reports"
      description="Your saved reports stay at the bottom so the current calculation remains the focus."
      action={<p className="text-sm text-slate-400">{history.length} reports</p>}
    >
      <div className="rounded-2xl bg-white/[0.055] p-5 shadow-xl shadow-slate-950/20 ring-1 ring-white/[0.07] md:p-6">
        {historyLoading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-white/[0.06]" />
        ) : historyData.length ? (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 12, left: -18, bottom: 8 }}>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="carbon" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} animationDuration={900} />
                  <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950/35">
              <div className="grid grid-cols-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span>Date</span>
                <span>Monthly Carbon</span>
                <span>Eco Score</span>
              </div>
              {history.slice(0, 6).map((item) => (
                <div key={item._id || item.reportId || item.createdAt} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm text-slate-300 odd:bg-white/[0.025]">
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Current report'}</span>
                  <span>{item.monthlyCarbonKg} kg</span>
                  <span>{item.ecoScore?.score ?? '-'} / 100</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-slate-950/35 p-10 text-center text-slate-400">
            No saved reports yet. Your first calculation will create the baseline.
          </div>
        )}
      </div>
    </SectionShell>
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
        label: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Current',
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
      } catch {
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
    <div className="mx-auto max-w-7xl text-white">
      {error ? (
        <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-100 shadow-lg shadow-red-950/20 ring-1 ring-red-300/25">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start">
        <div className="space-y-8">
          {result ? (
            <AnalyticsDashboard
              result={result}
              chartData={chartData}
              historyLoading={historyLoading}
              historyData={historyData}
              history={history}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              <HeroSection activeGroup={activeGroup} />
              <QuestionnaireCard
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                formData={formData}
                updateField={updateField}
                calculate={calculate}
                loading={loading}
              />
            </motion.div>
          )}
        </div>

        <div>
          {result ? (
            <StickyAIInsightsPanel result={result} downloadReport={downloadReport} />
          ) : (
            <StickyCarbonSummaryPanel activeGroup={activeGroup} formData={formData} />
          )}
        </div>
      </div>
    </div>
  )
}

export default CarbonCalculatorPage
