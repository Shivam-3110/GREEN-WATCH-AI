import mongoose from 'mongoose'

const carbonProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    latestLifestyle: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    latestEcoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    latestMonthlyCarbonKg: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

const CarbonProfile = mongoose.model('CarbonProfile', carbonProfileSchema)

export default CarbonProfile
