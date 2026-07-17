import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    total: { type: Number, required: true, min: 0 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
)

const carbonHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lifestyle: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    monthlyCarbonKg: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    yearlyCarbonKg: {
      type: Number,
      required: true,
      min: 0,
    },
    breakdown: {
      transportation: categorySchema,
      electricity: categorySchema,
      cooking: categorySchema,
      food: categorySchema,
      waste: categorySchema,
      water: categorySchema,
    },
    percentages: {
      type: Map,
      of: Number,
      default: {},
    },
    largestEmissionSource: {
      category: { type: String, required: true },
      value: { type: Number, required: true, min: 0 },
    },
    ecoScore: {
      score: { type: Number, required: true, min: 0, max: 100 },
      classification: {
        label: { type: String, required: true },
        tone: { type: String, required: true },
      },
    },
    impact: {
      treesNeededToOffset: Number,
      equivalentDrivingKm: Number,
      householdElectricityKWh: Number,
      coalBurnedKg: Number,
      smartphoneCharges: Number,
    },
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    aiStatus: {
      type: String,
      enum: ['generated', 'fallback'],
      default: 'fallback',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

carbonHistorySchema.index({ user: 1, createdAt: -1 })

const CarbonHistory = mongoose.model('CarbonHistory', carbonHistorySchema)

export default CarbonHistory
