import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectWaste } from '../services/wasteDetectionService';

const WASTE_COLORS = {
  plastic: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', icon: '♻️' },
  metal: { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-600', icon: '🔩' },
  organic: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', icon: '🌱' },
  'e-waste': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600', icon: '🔌' }
};

export default function WasteDetectionPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const data = await detectWaste(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const getWasteColor = (type) => WASTE_COLORS[type] || WASTE_COLORS.plastic;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🗑️ AI Waste Detection</h1>
          <p className="text-gray-600">Upload an image to identify waste types and get recycling guidance</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Upload Zone */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Image</h2>
              
              {!preview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-3 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'
                  }`}
                >
                  <motion.div
                    animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-6xl mb-4">📤</div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag & drop your image here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    <label className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium cursor-pointer hover:shadow-lg transition">
                      Browse Files
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-4">Supports: JPG, PNG, WEBP (Max 10MB)</p>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-xl overflow-hidden border-2 border-gray-200"
                  >
                    <img src={preview} alt="Preview" className="w-full h-80 object-cover" />
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>

                  {/* Analyze Button */}
                  {!result && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        '🔍 Analyze Waste'
                      )}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(WASTE_COLORS).map(([type, color], idx) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`${color.light} rounded-xl p-4 text-center`}
                >
                  <div className="text-3xl mb-2">{color.icon}</div>
                  <p className={`text-sm font-bold ${color.text} capitalize`}>{type}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  {/* Primary Result Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Detection Results</h2>
                      <button
                        onClick={handleReset}
                        className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        Analyze New Image
                      </button>
                    </div>

                    {/* Primary Waste Type */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="text-center mb-6"
                    >
                      <div className={`inline-flex items-center justify-center w-24 h-24 ${getWasteColor(result.primary_waste_type).bg} rounded-full text-5xl mb-3`}>
                        {getWasteColor(result.primary_waste_type).icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 capitalize mb-1">
                        {result.primary_waste_type}
                      </h3>
                      <p className="text-gray-600">
                        {(result.overall_confidence * 100).toFixed(1)}% Confidence
                      </p>
                      {/* Confidence Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.overall_confidence * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full ${getWasteColor(result.primary_waste_type).bg}`}
                        />
                      </div>
                    </motion.div>

                    {/* Detected Items */}
                    <div className="space-y-3 mb-6">
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Detected Items</h4>
                      {result.detected_waste.map((waste, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${getWasteColor(waste.waste_type).light} rounded-lg p-4 border-l-4 ${getWasteColor(waste.waste_type).bg}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-bold capitalize ${getWasteColor(waste.waste_type).text}`}>
                              {waste.waste_type}
                            </span>
                            <span className="text-sm font-medium text-gray-600">
                              {(waste.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{waste.disposal_method}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            waste.recyclable ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {waste.recyclable ? '♻️ Recyclable' : '🚫 Non-Recyclable'}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Processing Time */}
                    <p className="text-xs text-gray-400 text-center">
                      Processed in {result.processing_time_ms.toFixed(0)}ms
                    </p>
                  </div>

                  {/* Environmental Impact */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">🌍 Environmental Impact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
                        <p className="text-xs text-gray-600 mb-1">Severity</p>
                        <p className={`text-2xl font-bold ${
                          result.environmental_impact.severity === 'High' ? 'text-red-600' :
                          result.environmental_impact.severity === 'Medium' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {result.environmental_impact.severity}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                        <p className="text-xs text-gray-600 mb-1">Recyclable</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {result.environmental_impact.recyclable_percentage}%
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 col-span-2">
                        <p className="text-xs text-gray-600 mb-1">⏱️ Decomposition Time</p>
                        <p className="text-lg font-bold text-purple-600">
                          {result.environmental_impact.decomposition_time}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 col-span-2">
                        <p className="text-xs text-gray-600 mb-1">🌱 Carbon Footprint</p>
                        <p className="text-lg font-bold text-green-600">
                          {result.environmental_impact.carbon_footprint_kg} kg CO2e
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Recycling Suggestions</h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg"
                        >
                          <span className="text-cyan-600 font-bold text-lg">•</span>
                          <p className="text-sm text-gray-700 flex-1">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-600">Upload an image to detect waste and get recycling guidance</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
