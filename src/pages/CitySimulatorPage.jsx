import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import {
  Building,
  Tree,
  Road,
  Car,
  PollutionParticles,
  HeatHaze,
  Ground,
  Sky,
} from '../components/3d/CityComponents';

export default function CitySimulatorPage() {
  const [pollution, setPollution] = useState(0.5);
  const [treeCount, setTreeCount] = useState(20);
  const [traffic, setTraffic] = useState(0.5);
  const [temperature, setTemperature] = useState(30);
  const [showStats, setShowStats] = useState(true);

  // Calculate AQI based on parameters
  const calculateAQI = () => {
    const baseAQI = 150;
    const pollutionImpact = pollution * 200;
    const treeReduction = (treeCount / 50) * 50;
    const trafficImpact = traffic * 100;
    
    return Math.round(Math.max(0, baseAQI + pollutionImpact - treeReduction + trafficImpact));
  };

  const aqi = calculateAQI();
  const aqiCategory = 
    aqi <= 50 ? { label: 'Good', color: 'text-green-500' } :
    aqi <= 100 ? { label: 'Moderate', color: 'text-yellow-500' } :
    aqi <= 150 ? { label: 'Unhealthy (Sensitive)', color: 'text-orange-500' } :
    aqi <= 200 ? { label: 'Unhealthy', color: 'text-red-500' } :
    { label: 'Very Unhealthy', color: 'text-purple-500' };

  // Generate city layout
  const generateBuildings = () => {
    const buildings = [];
    const grid = 5;
    
    for (let x = -grid; x <= grid; x += 2) {
      for (let z = -grid; z <= grid; z += 2) {
        if (Math.abs(x) > 1 || Math.abs(z) > 1) {
          const height = Math.random() * 3 + 1;
          const buildingColor = `hsl(${200 + pollution * 50}, 70%, ${50 - pollution * 20}%)`;
          buildings.push(
            <Building
              key={`building-${x}-${z}`}
              position={[x, height / 2, z]}
              height={height}
              color={buildingColor}
              pollution={pollution}
            />
          );
        }
      }
    }
    return buildings;
  };

  const generateTrees = () => {
    const trees = [];
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 18;
      const scale = 0.5 + Math.random() * 0.5;
      
      trees.push(
        <Tree
          key={`tree-${i}`}
          position={[x, 0, z]}
          scale={scale}
        />
      );
    }
    return trees;
  };

  const generateCars = () => {
    const cars = [];
    const carCount = Math.floor(traffic * 15);
    
    for (let i = 0; i < carCount; i++) {
      const lane = Math.floor(i / 5) - 1;
      const colors = ['#ff0000', '#0000ff', '#ffff00', '#00ff00', '#ff00ff'];
      
      cars.push(
        <Car
          key={`car-${i}`}
          position={[-15 + i * 2, 0.15, lane * 2]}
          color={colors[i % colors.length]}
          speed={0.5 + Math.random() * 0.5}
        />
      );
    }
    return cars;
  };

  return (
    <div className="h-screen w-full bg-gray-900 relative overflow-hidden">
      {/* 3D Canvas */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={60} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.5}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#ff9966" />

          {/* Sky */}
          <Sky pollution={pollution} />

          {/* Ground */}
          <Ground />

          {/* Roads */}
          <Road start={[-15, 0, -2]} end={[15, 0, -2]} width={0.6} />
          <Road start={[-15, 0, 0]} end={[15, 0, 0]} width={0.6} />
          <Road start={[-15, 0, 2]} end={[15, 0, 2]} width={0.6} />

          {/* Buildings */}
          {generateBuildings()}

          {/* Trees */}
          {generateTrees()}

          {/* Traffic */}
          {generateCars()}

          {/* Pollution particles */}
          <PollutionParticles count={500} intensity={pollution} bounds={20} />

          {/* Heat haze effects */}
          {temperature > 35 && (
            <>
              <HeatHaze position={[5, 0.25, 5]} intensity={(temperature - 35) / 20} />
              <HeatHaze position={[-5, 0.25, -5]} intensity={(temperature - 35) / 20} />
            </>
          )}
        </Suspense>
      </Canvas>

      {/* Controls Panel */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="absolute top-4 left-4 bg-black/80 backdrop-blur-lg rounded-2xl p-6 w-80 text-white"
      >
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          🏙️ Smart City Simulator
        </h2>

        {/* Pollution Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            🏭 Industrial Pollution: {Math.round(pollution * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={pollution}
            onChange={(e) => setPollution(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Tree Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            🌳 Tree Coverage: {treeCount} trees
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={treeCount}
            onChange={(e) => setTreeCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Traffic Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            🚗 Traffic Density: {Math.round(traffic * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={traffic}
            onChange={(e) => setTraffic(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Temperature Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            🌡️ Temperature: {temperature}°C
          </label>
          <input
            type="range"
            min="20"
            max="50"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setPollution(0.5);
            setTreeCount(20);
            setTraffic(0.5);
            setTemperature(30);
          }}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition"
        >
          Reset Simulation
        </button>
      </motion.div>

      {/* Stats Panel */}
      {showStats && (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="absolute top-4 right-4 bg-black/80 backdrop-blur-lg rounded-2xl p-6 w-80 text-white"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📊 Environmental Stats</h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* AQI Display */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 mb-4">
            <div className="text-sm text-gray-400 mb-1">Air Quality Index</div>
            <div className={`text-4xl font-bold ${aqiCategory.color}`}>{aqi}</div>
            <div className={`text-sm ${aqiCategory.color}`}>{aqiCategory.label}</div>
          </div>

          {/* Impact Metrics */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">🌳 Tree Impact</span>
                <span className="font-bold text-green-400">-{Math.round((treeCount / 50) * 50)} AQI</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(treeCount / 50) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">🏭 Pollution</span>
                <span className="font-bold text-red-400">+{Math.round(pollution * 200)} AQI</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${pollution * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">🚗 Traffic</span>
                <span className="font-bold text-orange-400">+{Math.round(traffic * 100)} AQI</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${traffic * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">🌡️ Heat Impact</span>
                <span className="font-bold text-purple-400">
                  {temperature > 35 ? 'High' : temperature > 30 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-500/20">
            <div className="text-sm font-bold text-cyan-400 mb-2">💡 Recommendations</div>
            <ul className="text-xs space-y-1 text-gray-300">
              {aqi > 150 && <li>• Reduce industrial emissions</li>}
              {treeCount < 30 && <li>• Plant more trees for better air quality</li>}
              {traffic > 0.7 && <li>• Promote public transportation</li>}
              {temperature > 40 && <li>• Implement cooling strategies</li>}
              {aqi <= 100 && <li>• Great job! Maintain current levels</li>}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Bottom Info */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-lg rounded-full px-6 py-3 text-white text-sm"
      >
        <span className="text-cyan-400">🖱️ Drag to rotate</span>
        <span className="mx-2">•</span>
        <span className="text-blue-400">🔍 Scroll to zoom</span>
        <span className="mx-2">•</span>
        <span className="text-purple-400">⚙️ Adjust parameters</span>
      </motion.div>

      {/* Toggle Stats Button */}
      {!showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="absolute top-4 right-4 bg-cyan-500 text-white rounded-full p-3 hover:bg-cyan-600 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
