import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'special', 'community'],
    default: 'daily',
  },
  category: {
    type: String,
    enum: ['carbon', 'energy', 'water', 'waste', 'transport', 'lifestyle'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy',
  },
  points: {
    type: Number,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  targetValue: {
    type: Number,
  },
  targetUnit: {
    type: String,
  },
  completionCount: {
    type: Number,
    default: 0,
  },
  requirements: [{
    description: String,
    completed: Boolean,
  }],
}, {
  timestamps: true,
});

// Index for active challenges
challengeSchema.index({ isActive: 1, type: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('Challenge', challengeSchema);
