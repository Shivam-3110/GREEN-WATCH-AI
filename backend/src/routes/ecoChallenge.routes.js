import { Router } from 'express';
import {
  getUserProfile,
  completeChallenge,
  fetchLeaderboard,
  fetchActiveChallenges,
  fetchBadges,
  createDailyChallenges,
  getUserStats,
} from '../controllers/ecoChallenge.controller.js';

const router = Router();

// User profile and stats
router.get('/profile/:userId', getUserProfile);
router.get('/stats/:userId', getUserStats);

// Challenges
router.get('/challenges', fetchActiveChallenges);
router.post('/challenges/:challengeId/complete', completeChallenge);
router.post('/challenges/generate', createDailyChallenges);

// Leaderboard
router.get('/leaderboard', fetchLeaderboard);

// Badges
router.get('/badges', fetchBadges);

export default router;
