import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GlassCard,
  StatCard,
  NeonProgress,
  Badge,
  SectionHeader,
  Skeleton,
  LoadingSpinner,
} from '../components/ui/UIComponents';

export default function EnhancedDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setStats({
        aqi: { value: 145, category: 'Moderate', trend: -5 },
        carbonSaved: { value: '2.4K', unit: 'kg', trend: 12 },
        ecoScore: { value: 78, max: 100, trend: 8 },
        treesEquivalent: { value: 156, trend: 15 },
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-400 text-sm">Loading your environmental dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-3xl -z-10" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Environmental Dashboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Real-time monitoring of your environmental impact</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            icon="🌬️"
            label="Air Quality Index"
            value={stats.aqi.value}
            trend={stats.aqi.trend}
          />
          <StatCard
            icon="🌱"
            label="Carbon Saved"
            value={stats.carbonSaved.value}
            trend={stats.carbonSaved.trend}
          />
          <StatCard
            icon="⭐"
            label="Eco Score"
            value={stats.ecoScore.value}
            trend={stats.ecoScore.trend}
          />
          <StatCard
            icon="🌳"
            label="Trees Equivalent"
            value={stats.treesEquivalent.value}
            trend={stats.treesEquivalent.trend}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Large Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* AQI Monitor */}
            <GlassCard className="p-6">
              <SectionHeader
                title="Air Quality Monitor"
                subtitle="Real-time AQI tracking"
                action={<Badge variant="success">Live</Badge>}
              />
              
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-6xl font-bold text-white mb-2">{stats.aqi.value}</div>
                    <Badge variant="warning">Moderate</Badge>
                  </div>
                  <div className="text-6xl">🌬️</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">PM2.5</span>
                      <span className="text-emerald-400">Good</span>
                    </div>
                    <NeonProgress value={35} max={100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">PM10</span>
                      <span className="text-yellow-400">Moderate</span>
                    </div>
                    <NeonProgress value={65} max={100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">O₃</span>
                      <span className="text-emerald-400">Good</span>
                    </div>
                    <NeonProgress value={28} max={100} />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Carbon Footprint */}
            <GlassCard className="p-6">
              <SectionHeader
                title="Carbon Footprint"
                subtitle="Your monthly environmental impact"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Transport', value: '45%', color: 'from-red-500 to-orange-500' },
                  { label: 'Energy', value: '30%', color: 'from-yellow-500 to-amber-500' },
                  { label: 'Food', value: '15%', color: 'from-green-500 to-emerald-500' },
                  { label: 'Waste', value: '10%', color: 'from-cyan-500 to-blue-500' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-center p-4 bg-slate-800/50 rounded-xl"
                  >
                    <div className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {item.value}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="space-y-6">
            {/* Recent Activities */}
            <GlassCard className="p-6">
              <SectionHeader title="Recent Activities" />
              
              <div className="space-y-3">
                {[
                  { icon: '🚴', text: 'Cycled to work', time: '2h ago', points: '+50' },
                  { icon: '♻️', text: 'Recycled plastic', time: '5h ago', points: '+30' },
                  { icon: '🌱', text: 'Planted a tree', time: '1d ago', points: '+100' },
                  { icon: '💡', text: 'Saved energy', time: '2d ago', points: '+25' },
                ].map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition"
                  >
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{activity.text}</div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                    <div className="text-emerald-400 font-semibold text-sm">{activity.points}</div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Achievements */}
            <GlassCard className="p-6">
              <SectionHeader title="Latest Achievements" />
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🏆', label: 'Eco Champion' },
                  { icon: '🔥', label: '7 Day Streak' },
                  { icon: '⭐', label: 'Level 5' },
                  { icon: '🌍', label: 'Planet Hero' },
                  { icon: '💎', label: '1K Points' },
                  { icon: '🎯', label: 'Goal Master' },
                ].map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-center p-3 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20"
                  >
                    <div className="text-3xl mb-1">{badge.icon}</div>
                    <div className="text-xs text-gray-300">{badge.label}</div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <GlassCard className="p-6">
            <SectionHeader title="Quick Actions" />
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📊', label: 'View Reports', color: 'from-blue-500 to-cyan-500' },
                { icon: '🎯', label: 'Set Goals', color: 'from-purple-500 to-pink-500' },
                { icon: '🌳', label: 'Track Trees', color: 'from-green-500 to-emerald-500' },
                { icon: '📈', label: 'Analytics', color: 'from-orange-500 to-red-500' },
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 bg-gradient-to-br ${action.color} rounded-xl text-white font-semibold text-sm transition-all`}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  {action.label}
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Environmental Tips */}
          <GlassCard className="p-6">
            <SectionHeader title="Today's Eco Tip" />
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 border border-emerald-500/20">
              <div className="text-5xl mb-4">💡</div>
              <p className="text-white text-lg font-medium mb-2">
                Switch to LED Bulbs
              </p>
              <p className="text-gray-400 text-sm">
                LED bulbs use 75% less energy and last 25 times longer than incandescent bulbs. 
                Make the switch today and reduce your carbon footprint!
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
