import mongoose from 'mongoose'

const ecoReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
      index: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
    metrics: {
      avgAqi: { type: Number, min: 0, max: 500 },
      carbonScore: { type: Number, min: 0, max: 1000 },
      wasteDetections: { type: Number, default: 0, min: 0 },
      alertsTriggered: { type: Number, default: 0, min: 0 },
    },
    references: {
      pollutionData: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollutionData' }],
      carbonScores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CarbonScore' }],
      wasteDetections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WasteDetection' }],
      alerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
      challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EcoChallenge' }],
    },
    generatedBy: {
      type: String,
      enum: ['system', 'ai', 'user'],
      default: 'system',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

ecoReportSchema.index({ user: 1, reportType: 1, createdAt: -1 })

const EcoReport = mongoose.model('EcoReport', ecoReportSchema)

export default EcoReport