import mongoose from 'mongoose'

const detectedItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    count: { type: Number, default: 1, min: 1 },
    isRecyclable: { type: Boolean, default: false },
  },
  { _id: false },
)

const wasteDetectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    locationName: {
      type: String,
      trim: true,
    },
    capturedAt: {
      type: Date,
      required: true,
      index: true,
    },
    detectedItems: {
      type: [detectedItemSchema],
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: 'At least one detected item is required',
      },
    },
    summary: {
      totalItems: { type: Number, default: 0, min: 0 },
      recyclableItems: { type: Number, default: 0, min: 0 },
      wasteScore: { type: Number, min: 0, max: 100 },
    },
    modelVersion: {
      type: String,
      trim: true,
      default: 'v1',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

wasteDetectionSchema.index({ user: 1, capturedAt: -1 })

const WasteDetection = mongoose.model('WasteDetection', wasteDetectionSchema)

export default WasteDetection