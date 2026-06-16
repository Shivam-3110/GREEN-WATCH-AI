import {
  getOrCreateEcoPoints,
  awardPoints,
  getLeaderboard,
  getActiveChallenges,
  generateDailyChallenges,
  BADGES,
} from '../services/ecoChallenge.service.js';
import Challenge from '../models/Challenge.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const ecoPoints = await getOrCreateEcoPoints(userId);

    res.status(200).json({
      success: true,
      data: {
        userId: ecoPoints.userId._id,
        name: ecoPoints.userId.name,
        totalPoints: ecoPoints.totalPoints,
        weeklyPoints: ecoPoints.weeklyPoints,
        monthlyPoints: ecoPoints.monthlyPoints,
        level: ecoPoints.level,
        rank: ecoPoints.rank,
        badges: ecoPoints.badges,
        streak: ecoPoints.streak,
        completedChallenges: ecoPoints.completedChallenges.length,
        levelProgress: {
          current: ecoPoints.totalPoints % 1000,
          required: ecoPoints.level * 1000,
          percentage: ((ecoPoints.totalPoints % 1000) / (ecoPoints.level * 1000)) * 100,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message,
    });
  }
};

// Complete challenge
export const completeChallenge = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { challengeId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not active',
      });
    }

    const { ecoPoints, newBadges } = await awardPoints(
      userId,
      challengeId,
      challenge.points
    );

    // Update challenge completion count
    challenge.completionCount += 1;
    await challenge.save();

    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully!',
      data: {
        pointsEarned: challenge.points,
        totalPoints: ecoPoints.totalPoints,
        level: ecoPoints.level,
        newBadges,
        streak: ecoPoints.streak,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete challenge',
    });
  }
};

// Get leaderboard
export const fetchLeaderboard = async (req, res) => {
  try {
    const { type = 'total', limit = 100 } = req.query;

    const leaderboard = await getLeaderboard(type, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        type,
        leaderboard: leaderboard.map(entry => ({
          rank: entry.rank,
          userId: entry.userId._id,
          name: entry.userId.name,
          points: type === 'weekly' 
            ? entry.weeklyPoints 
            : type === 'monthly' 
            ? entry.monthlyPoints 
            : entry.totalPoints,
          level: entry.level,
          badges: entry.badges.length,
          streak: entry.streak.current,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
};

// Get active challenges
export const fetchActiveChallenges = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const challenges = await getActiveChallenges(userId);

    res.status(200).json({
      success: true,
      data: {
        challenges,
        count: challenges.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
      error: error.message,
    });
  }
};

// Get available badges
export const fetchBadges = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        badges: Object.values(BADGES),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message,
    });
  }
};

// Generate new daily challenges (admin)
export const createDailyChallenges = async (req, res) => {
  try {
    const challenges = await generateDailyChallenges();

    res.status(200).json({
      success: true,
      message: 'Daily challenges generated successfully',
      data: {
        challenges,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily challenges',
      error: error.message,
    });
  }
};

// Get user stats
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;
    const ecoPoints = await getOrCreateEcoPoints(userId);

    const stats = {
      overview: {
        totalPoints: ecoPoints.totalPoints,
        level: ecoPoints.level,
        rank: ecoPoints.rank,
        badges: ecoPoints.badges.length,
      },
      challenges: {
        total: ecoPoints.completedChallenges.length,
        thisWeek: ecoPoints.completedChallenges.filter(c => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(c.completedAt) > weekAgo;
        }).length,
        thisMonth: ecoPoints.completedChallenges.filter(c => {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return new Date(c.completedAt) > monthAgo;
        }).length,
      },
      streak: ecoPoints.streak,
      recentBadges: ecoPoints.badges.slice(-5).reverse(),
      recentChallenges: ecoPoints.completedChallenges.slice(-10).reverse(),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message,
    });
  }
};
