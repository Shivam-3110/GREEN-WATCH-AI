import mongoose from 'mongoose';

const ecoPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  rank: {
    type: Number,
    default: 0,
  },
  weeklyPoints: {
    type: Number,
    default: 0,
  },
  monthlyPoints: {
    type: Number,
    default: 0,
  },
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: Date,
  }],
  completedChallenges: [{
    challengeId: String,
    completedAt: Date,
    pointsEarned: Number,
  }],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastCompletionDate: Date,
  },
}, {
  timestamps: true,
});

// Index for leaderboard queries
ecoPointsSchema.index({ totalPoints: -1 });
ecoPointsSchema.index({ weeklyPoints: -1 });
ecoPointsSchema.index({ monthlyPoints: -1 });
ecoPointsSchema.index({ userId: 1 });

// Virtual for level progress
ecoPointsSchema.virtual('levelProgress').get(function() {
  const pointsForNextLevel = this.level * 1000;
  const pointsInCurrentLevel = this.totalPoints % 1000;
  return {
    current: pointsInCurrentLevel,
    required: pointsForNextLevel,
    percentage: (pointsInCurrentLevel / pointsForNextLevel) * 100,
  };
});

export default mongoose.model('EcoPoints', ecoPointsSchema);
