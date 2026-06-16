import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const DIFFICULTY_COLORS = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

export default function EcoChallengePage() {
  const [profile, setProfile] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardType, setLeaderboardType] = useState('total');
  const [loading, setLoading] = useState(true);
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  const userId = localStorage.getItem('userId') || 'guest_user';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  const fetchData = async () => {
    try {
      const [profileRes, challengesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/v1/eco-challenge/profile/${userId}`),
        axios.get(`http://localhost:5000/api/v1/eco-challenge/challenges?userId=${userId}`),
      ]);

      setProfile(profileRes.data.data);
      setChallenges(challengesRes.data.data.challenges);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/eco-challenge/leaderboard?type=${leaderboardType}&limit=10`
      );
      setLeaderboard(response.data.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const completeChallenge = async (challengeId) => {
    setCompletingChallenge(challengeId);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/v1/eco-challenge/challenges/${challengeId}/complete`,
        { userId }
      );

      if (response.data.data.newBadges?.length > 0) {
        setNewBadges(response.data.data.newBadges);
        setShowBadgeModal(true);
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      alert(error.response?.data?.message || 'Failed to complete challenge');
    } finally {
      setCompletingChallenge(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🌍 Eco Challenge</h1>
          <p className="text-gray-600">Complete missions, earn points, and save the planet!</p>
        </motion.div>

        {/* User Profile Card */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600">{profile.level}</div>
                <div className="text-xs text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{profile.totalPoints}</div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">#{profile.rank || '-'}</div>
                <div className="text-xs text-gray-600">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-3xl">🔥</div>
                <div className="text-sm font-bold text-gray-700">{profile.streak.current} days</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl">🏆</div>
                <div className="text-sm font-bold text-gray-700">{profile.badges.length}</div>
                <div className="text-xs text-gray-600">Badges</div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Level {profile.level}</span>
                <span>{profile.levelProgress.current} / {profile.levelProgress.required} XP</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.levelProgress.percentage}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Daily Challenges */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">🎯 Daily Missions</h2>
            <AnimatePresence>
              {challenges.map((challenge, idx) => (
                <motion.div
                  key={challenge._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                    challenge.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{challenge.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                          </div>
                          <span className={`${DIFFICULTY_COLORS[challenge.difficulty]} text-white text-xs px-3 py-1 rounded-full capitalize`}>
                            {challenge.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">💎</span>
                            <span className="font-bold text-gray-700">{challenge.points} points</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>✅ {challenge.completionCount} completed</span>
                          </div>
                        </div>

                        {!challenge.completed ? (
                          <button
                            onClick={() => completeChallenge(challenge._id)}
                            disabled={completingChallenge === challenge._id}
                            className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                          >
                            {completingChallenge === challenge._id ? 'Completing...' : 'Complete Challenge'}
                          </button>
                        ) : (
                          <div className="mt-4 w-full bg-green-100 text-green-600 py-2 rounded-lg font-medium text-center">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h3>
              
              <div className="flex gap-2 mb-4">
                {['total', 'weekly', 'monthly'].map(type => (
                  <button
                    key={type}
                    onClick={() => setLeaderboardType(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition ${
                      leaderboardType === type
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      entry.userId === userId ? 'bg-cyan-50 border border-cyan-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">{entry.name}</div>
                      <div className="text-xs text-gray-500">Level {entry.level} • {entry.badges} badges</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-600">{entry.points}</div>
                      <div className="text-xs text-gray-500">pts</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Badges */}
            {profile?.badges.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🏅 Recent Badges</h3>
                <div className="grid grid-cols-3 gap-3">
                  {profile.badges.slice(-6).reverse().map((badge, idx) => (
                    <motion.div
                      key={badge.badgeId}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl"
                      title={badge.description}
                    >
                      <div className="text-3xl mb-1">{badge.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{badge.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Badge Modal */}
        <AnimatePresence>
          {showBadgeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowBadgeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold text-center mb-6">🎉 New Badge Unlocked!</h3>
                <div className="space-y-4">
                  {newBadges.map((badge, idx) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl"
                    >
                      <div className="text-5xl">{badge.icon}</div>
                      <div>
                        <div className="font-bold text-gray-800">{badge.name}</div>
                        <div className="text-sm text-gray-600">{badge.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
