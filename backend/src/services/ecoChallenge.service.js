import EcoPoints from '../models/EcoPoints.js';
import Challenge from '../models/Challenge.js';

// Badge definitions
export const BADGES = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first challenge',
    icon: '👣',
    requirement: { type: 'challenges', count: 1 },
  },
  ECO_WARRIOR: {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Complete 10 challenges',
    icon: '⚔️',
    requirement: { type: 'challenges', count: 10 },
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: '7-day completion streak',
    icon: '🔥',
    requirement: { type: 'streak', count: 7 },
  },
  POINT_COLLECTOR: {
    id: 'point_collector',
    name: 'Point Collector',
    description: 'Earn 1000 points',
    icon: '💎',
    requirement: { type: 'points', count: 1000 },
  },
  CARBON_CHAMPION: {
    id: 'carbon_champion',
    name: 'Carbon Champion',
    description: 'Complete 5 carbon challenges',
    icon: '🌱',
    requirement: { type: 'category', category: 'carbon', count: 5 },
  },
  ENERGY_SAVER: {
    id: 'energy_saver',
    name: 'Energy Saver',
    description: 'Complete 5 energy challenges',
    icon: '⚡',
    requirement: { type: 'category', category: 'energy', count: 5 },
  },
  WATER_GUARDIAN: {
    id: 'water_guardian',
    name: 'Water Guardian',
    description: 'Complete 5 water challenges',
    icon: '💧',
    requirement: { type: 'category', category: 'water', count: 5 },
  },
  LEVEL_5: {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    requirement: { type: 'level', count: 5 },
  },
  LEVEL_10: {
    id: 'level_10',
    name: 'Eco Legend',
    description: 'Reach Level 10',
    icon: '🏆',
    requirement: { type: 'level', count: 10 },
  },
  TOP_10: {
    id: 'top_10',
    name: 'Top 10',
    description: 'Reach top 10 on leaderboard',
    icon: '🥇',
    requirement: { type: 'rank', count: 10 },
  },
};

// Daily challenges pool
export const DAILY_CHALLENGES = [
  {
    title: 'Use Public Transport',
    description: 'Take public transport instead of driving today',
    category: 'transport',
    difficulty: 'easy',
    points: 50,
    icon: '🚌',
  },
  {
    title: 'Zero Plastic Day',
    description: 'Avoid single-use plastics for the entire day',
    category: 'waste',
    difficulty: 'medium',
    points: 75,
    icon: '♻️',
  },
  {
    title: 'Lights Out',
    description: 'Turn off all unnecessary lights for 1 hour',
    category: 'energy',
    difficulty: 'easy',
    points: 40,
    icon: '💡',
  },
  {
    title: 'Meatless Monday',
    description: 'Have a plant-based day with no meat',
    category: 'carbon',
    difficulty: 'medium',
    points: 80,
    icon: '🥗',
  },
  {
    title: 'Water Warrior',
    description: 'Reduce shower time to under 5 minutes',
    category: 'water',
    difficulty: 'easy',
    points: 45,
    icon: '🚿',
  },
  {
    title: 'Bike to Work',
    description: 'Cycle or walk to work/errands',
    category: 'transport',
    difficulty: 'medium',
    points: 70,
    icon: '🚴',
  },
  {
    title: 'Compost Creator',
    description: 'Start composting organic waste',
    category: 'waste',
    difficulty: 'hard',
    points: 100,
    icon: '🌱',
  },
  {
    title: 'Energy Audit',
    description: 'Unplug unused electronics for the day',
    category: 'energy',
    difficulty: 'easy',
    points: 50,
    icon: '🔌',
  },
  {
    title: 'Reusable Everything',
    description: 'Use only reusable bags, bottles, and containers',
    category: 'lifestyle',
    difficulty: 'medium',
    points: 60,
    icon: '🛍️',
  },
  {
    title: 'Local Shopping',
    description: 'Buy from local farmers market',
    category: 'carbon',
    difficulty: 'medium',
    points: 65,
    icon: '🥕',
  },
];

// Get or create user eco points
export const getOrCreateEcoPoints = async (userId) => {
  let ecoPoints = await EcoPoints.findOne({ userId }).populate('userId', 'name email');
  
  if (!ecoPoints) {
    ecoPoints = await EcoPoints.create({ userId });
    await ecoPoints.populate('userId', 'name email');
  }
  
  return ecoPoints;
};

// Award points for completing challenge
export const awardPoints = async (userId, challengeId, points) => {
  const ecoPoints = await getOrCreateEcoPoints(userId);
  
  // Check if challenge already completed
  const alreadyCompleted = ecoPoints.completedChallenges.some(
    c => c.challengeId === challengeId
  );
  
  if (alreadyCompleted) {
    throw new Error('Challenge already completed');
  }
  
  // Update points
  ecoPoints.totalPoints += points;
  ecoPoints.weeklyPoints += points;
  ecoPoints.monthlyPoints += points;
  
  // Update level
  const newLevel = Math.floor(ecoPoints.totalPoints / 1000) + 1;
  ecoPoints.level = newLevel;
  
  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCompletion = ecoPoints.streak.lastCompletionDate
    ? new Date(ecoPoints.streak.lastCompletionDate)
    : null;
  
  if (lastCompletion) {
    lastCompletion.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastCompletion) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      ecoPoints.streak.current += 1;
      if (ecoPoints.streak.current > ecoPoints.streak.longest) {
        ecoPoints.streak.longest = ecoPoints.streak.current;
      }
    } else if (daysDiff > 1) {
      ecoPoints.streak.current = 1;
    }
  } else {
    ecoPoints.streak.current = 1;
  }
  
  ecoPoints.streak.lastCompletionDate = new Date();
  
  // Add completed challenge
  ecoPoints.completedChallenges.push({
    challengeId,
    completedAt: new Date(),
    pointsEarned: points,
  });
  
  await ecoPoints.save();
  
  // Check for new badges
  const newBadges = await checkAndAwardBadges(ecoPoints);
  
  return { ecoPoints, newBadges };
};

// Check and award badges
export const checkAndAwardBadges = async (ecoPoints) => {
  const newBadges = [];
  const earnedBadgeIds = ecoPoints.badges.map(b => b.badgeId);
  
  for (const badge of Object.values(BADGES)) {
    if (earnedBadgeIds.includes(badge.id)) continue;
    
    let shouldAward = false;
    
    switch (badge.requirement.type) {
      case 'challenges':
        shouldAward = ecoPoints.completedChallenges.length >= badge.requirement.count;
        break;
      case 'streak':
        shouldAward = ecoPoints.streak.current >= badge.requirement.count;
        break;
      case 'points':
        shouldAward = ecoPoints.totalPoints >= badge.requirement.count;
        break;
      case 'level':
        shouldAward = ecoPoints.level >= badge.requirement.count;
        break;
      case 'rank':
        shouldAward = ecoPoints.rank > 0 && ecoPoints.rank <= badge.requirement.count;
        break;
      case 'category':
        const categoryCount = ecoPoints.completedChallenges.filter(c => {
          // Would need to look up challenge category - simplified here
          return true;
        }).length;
        shouldAward = categoryCount >= badge.requirement.count;
        break;
    }
    
    if (shouldAward) {
      ecoPoints.badges.push({
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date(),
      });
      newBadges.push(badge);
    }
  }
  
  if (newBadges.length > 0) {
    await ecoPoints.save();
  }
  
  return newBadges;
};

// Get leaderboard
export const getLeaderboard = async (type = 'total', limit = 100) => {
  const sortField = type === 'weekly' ? 'weeklyPoints' : type === 'monthly' ? 'monthlyPoints' : 'totalPoints';
  
  const leaderboard = await EcoPoints.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
  
  // Add rank
  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

// Update user ranks
export const updateRanks = async () => {
  const allUsers = await EcoPoints.find().sort({ totalPoints: -1 });
  
  for (let i = 0; i < allUsers.length; i++) {
    allUsers[i].rank = i + 1;
    await allUsers[i].save();
  }
  
  return allUsers.length;
};

// Reset weekly/monthly points (run via cron)
export const resetPeriodPoints = async (period) => {
  const field = period === 'weekly' ? 'weeklyPoints' : 'monthlyPoints';
  await EcoPoints.updateMany({}, { [field]: 0 });
};

// Generate daily challenges
export const generateDailyChallenges = async () => {
  // Delete old daily challenges
  await Challenge.deleteMany({ type: 'daily' });
  
  // Select 3 random challenges
  const shuffled = [...DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  const challenges = await Challenge.insertMany(
    selected.map(c => ({
      ...c,
      type: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
    }))
  );
  
  return challenges;
};

// Get active challenges
export const getActiveChallenges = async (userId) => {
  const challenges = await Challenge.find({
    isActive: true,
    $or: [
      { endDate: { $gt: new Date() } },
      { endDate: null },
    ],
  }).lean();
  
  if (userId) {
    const ecoPoints = await EcoPoints.findOne({ userId });
    const completedIds = ecoPoints?.completedChallenges.map(c => c.challengeId) || [];
    
    return challenges.map(c => ({
      ...c,
      completed: completedIds.includes(c._id.toString()),
    }));
  }
  
  return challenges;
};
