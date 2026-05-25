import mongoose from 'mongoose'

const carbonScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Carbon score is required'],
      min: [0, 'Score cannot be negative'],
      max: [1000, 'Score cannot exceed 1000'],
      index: true,
    },
    category: {
      type: String,
      enum: ['excellent', 'good', 'moderate', 'poor', 'critical'],
      required: true,
      index: true,
    },
    footprintKgCO2e: {
      type: Number,
      required: [true, 'Footprint value is required'],
      min: [0, 'Footprint cannot be negative'],
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    factors: {
      transport: { type: Number, default: 0, min: 0 },
      energy: { type: Number, default: 0, min: 0 },
      food: { type: Number, default: 0, min: 0 },
      waste: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

carbonScoreSchema.index({ user: 1, 'period.startDate': -1 })

const CarbonScore = mongoose.model('CarbonScore', carbonScoreSchema)

export default CarbonScore