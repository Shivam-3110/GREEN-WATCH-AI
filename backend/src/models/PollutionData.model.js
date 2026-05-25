import mongoose from 'mongoose'

const pollutionDataSchema = new mongoose.Schema(
  {
    location: {
      name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          required: true,
          validate: {
            validator: (val) => Array.isArray(val) && val.length === 2,
            message: 'Coordinates must be [longitude, latitude]',
          },
        },
      },
    },
    source: {
      type: String,
      required: true,
      enum: ['sensor', 'satellite', 'manual', 'api'],
      index: true,
    },
    capturedAt: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
      aqi: { type: Number, required: true, min: 0, max: 500 },
      pm25: { type: Number, min: 0 },
      pm10: { type: Number, min: 0 },
      no2: { type: Number, min: 0 },
      so2: { type: Number, min: 0 },
      o3: { type: Number, min: 0 },
      co: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

pollutionDataSchema.index({ 'location.coordinates': '2dsphere' })
pollutionDataSchema.index({ capturedAt: -1, status: 1 })

const PollutionData = mongoose.model('PollutionData', pollutionDataSchema)

export default PollutionData