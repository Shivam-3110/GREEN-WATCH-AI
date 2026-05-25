import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pollutionData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PollutionData',
      index: true,
    },
    type: {
      type: String,
      enum: ['aqi', 'weather', 'waste', 'challenge', 'system'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

alertSchema.index({ user: 1, isRead: 1, sentAt: -1 })

const Alert = mongoose.model('Alert', alertSchema)

export default Alert