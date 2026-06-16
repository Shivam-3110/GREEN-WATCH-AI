import { getIO } from '../sockets/socketServer.js';

// Alert severity levels
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

// Alert types
export const ALERT_TYPES = {
  AQI: 'aqi',
  HEATWAVE: 'heatwave',
  FLOOD: 'flood',
  STORM: 'storm',
  WILDFIRE: 'wildfire',
};

// AQI thresholds
const AQI_THRESHOLDS = {
  GOOD: { min: 0, max: 50, severity: ALERT_SEVERITY.INFO },
  MODERATE: { min: 51, max: 100, severity: ALERT_SEVERITY.INFO },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, severity: ALERT_SEVERITY.WARNING },
  UNHEALTHY: { min: 151, max: 200, severity: ALERT_SEVERITY.WARNING },
  VERY_UNHEALTHY: { min: 201, max: 300, severity: ALERT_SEVERITY.CRITICAL },
  HAZARDOUS: { min: 301, max: 500, severity: ALERT_SEVERITY.EMERGENCY },
};

// Temperature thresholds (Celsius)
const TEMPERATURE_THRESHOLDS = {
  HEATWAVE_WARNING: 35,
  HEATWAVE_CRITICAL: 40,
  HEATWAVE_EMERGENCY: 45,
};

// Create AQI alert
export const createAQIAlert = (location, aqi, pollutant) => {
  let category = 'Good';
  let severity = ALERT_SEVERITY.INFO;
  
  if (aqi >= 301) {
    category = 'Hazardous';
    severity = ALERT_SEVERITY.EMERGENCY;
  } else if (aqi >= 201) {
    category = 'Very Unhealthy';
    severity = ALERT_SEVERITY.CRITICAL;
  } else if (aqi >= 151) {
    category = 'Unhealthy';
    severity = ALERT_SEVERITY.WARNING;
  } else if (aqi >= 101) {
    category = 'Unhealthy for Sensitive Groups';
    severity = ALERT_SEVERITY.WARNING;
  } else if (aqi >= 51) {
    category = 'Moderate';
    severity = ALERT_SEVERITY.INFO;
  }

  const alert = {
    id: generateAlertId(),
    type: ALERT_TYPES.AQI,
    severity,
    title: `${category} Air Quality`,
    message: `Air Quality Index is ${aqi} in ${location}`,
    details: {
      location,
      aqi,
      category,
      pollutant: pollutant || 'PM2.5',
    },
    recommendations: getAQIRecommendations(aqi),
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
  };

  return alert;
};

// Create heatwave alert
export const createHeatwaveAlert = (location, temperature, duration) => {
  let severity = ALERT_SEVERITY.WARNING;
  let level = 'Warning';
  
  if (temperature >= TEMPERATURE_THRESHOLDS.HEATWAVE_EMERGENCY) {
    severity = ALERT_SEVERITY.EMERGENCY;
    level = 'Emergency';
  } else if (temperature >= TEMPERATURE_THRESHOLDS.HEATWAVE_CRITICAL) {
    severity = ALERT_SEVERITY.CRITICAL;
    level = 'Critical';
  }

  const alert = {
    id: generateAlertId(),
    type: ALERT_TYPES.HEATWAVE,
    severity,
    title: `Heatwave ${level}`,
    message: `Extreme heat of ${temperature}°C expected in ${location}`,
    details: {
      location,
      temperature,
      duration: duration || 'Next 24-48 hours',
      feelsLike: temperature + 5,
    },
    recommendations: getHeatwaveRecommendations(temperature),
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
  };

  return alert;
};

// Create flood alert
export const createFloodAlert = (location, riskLevel, rainfall) => {
  let severity = ALERT_SEVERITY.WARNING;
  
  if (riskLevel === 'high' || riskLevel === 'extreme') {
    severity = ALERT_SEVERITY.CRITICAL;
  }
  if (riskLevel === 'severe') {
    severity = ALERT_SEVERITY.EMERGENCY;
  }

  const alert = {
    id: generateAlertId(),
    type: ALERT_TYPES.FLOOD,
    severity,
    title: `Flood ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`,
    message: `Flooding risk in ${location} due to heavy rainfall`,
    details: {
      location,
      riskLevel,
      rainfall: rainfall || 'Heavy rainfall expected',
      affectedAreas: ['Low-lying areas', 'Near water bodies'],
    },
    recommendations: getFloodRecommendations(riskLevel),
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };

  return alert;
};

// Emit alert to connected clients
export const emitAlert = (alert, targetRoom = null) => {
  try {
    const io = getIO();
    
    if (targetRoom) {
      io.to(targetRoom).emit('environmental:alert', alert);
      console.log(`🚨 Alert emitted to room: ${targetRoom}`);
    } else {
      io.emit('environmental:alert', alert);
      console.log(`🚨 Alert broadcasted to all clients`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to emit alert:', error.message);
    return false;
  }
};

// Emit bulk alerts
export const emitBulkAlerts = (alerts, targetRoom = null) => {
  try {
    const io = getIO();
    
    if (targetRoom) {
      io.to(targetRoom).emit('environmental:alerts:bulk', alerts);
    } else {
      io.emit('environmental:alerts:bulk', alerts);
    }
    
    console.log(`🚨 ${alerts.length} alerts emitted`);
    return true;
  } catch (error) {
    console.error('Failed to emit bulk alerts:', error.message);
    return false;
  }
};

// Get AQI recommendations
const getAQIRecommendations = (aqi) => {
  if (aqi >= 301) {
    return [
      '🚨 Stay indoors with windows closed',
      '😷 Wear N95 masks if you must go outside',
      '🏥 Seek medical attention if experiencing symptoms',
      '❌ Avoid all outdoor activities',
      '🔒 Keep children and elderly indoors',
    ];
  } else if (aqi >= 201) {
    return [
      '🏠 Limit outdoor activities',
      '😷 Wear masks when going outside',
      '👶 Keep children and sensitive groups indoors',
      '💨 Use air purifiers indoors',
      '🚫 Avoid strenuous outdoor exercise',
    ];
  } else if (aqi >= 151) {
    return [
      '⚠️ Reduce prolonged outdoor exertion',
      '😷 Consider wearing masks',
      '👥 Sensitive groups should limit outdoor activities',
      '🏃 Avoid intense outdoor exercise',
    ];
  } else if (aqi >= 101) {
    return [
      '👥 Sensitive groups should reduce outdoor activities',
      '🏃 Limit intense outdoor exercise',
      '🪟 Keep windows closed during peak hours',
    ];
  } else if (aqi >= 51) {
    return [
      '👥 Unusually sensitive people should limit prolonged outdoor exertion',
      '🌳 Good time for moderate outdoor activities',
    ];
  } else {
    return [
      '✅ Air quality is satisfactory',
      '🌳 Great time for outdoor activities',
    ];
  }
};

// Get heatwave recommendations
const getHeatwaveRecommendations = (temperature) => {
  if (temperature >= TEMPERATURE_THRESHOLDS.HEATWAVE_EMERGENCY) {
    return [
      '🏠 Stay indoors in air-conditioned spaces',
      '💧 Drink water every 15-20 minutes',
      '❌ Avoid all outdoor activities',
      '🚨 Check on elderly neighbors and relatives',
      '🏥 Know signs of heat stroke',
      '❄️ Never leave anyone in parked vehicles',
    ];
  } else if (temperature >= TEMPERATURE_THRESHOLDS.HEATWAVE_CRITICAL) {
    return [
      '💧 Drink plenty of water',
      '🏠 Stay in shaded or air-conditioned areas',
      '⏰ Avoid outdoor activities between 10 AM - 4 PM',
      '👕 Wear light-colored, loose clothing',
      '🚿 Take cool showers',
    ];
  } else {
    return [
      '💧 Stay hydrated',
      '☂️ Use sun protection',
      '⏰ Limit outdoor activities during peak hours',
      '👕 Wear light, breathable clothing',
    ];
  }
};

// Get flood recommendations
const getFloodRecommendations = (riskLevel) => {
  if (riskLevel === 'severe' || riskLevel === 'extreme') {
    return [
      '🚨 Evacuate if instructed by authorities',
      '📱 Keep emergency contacts handy',
      '🎒 Prepare emergency kit',
      '💧 Store drinking water',
      '🔌 Turn off utilities if flooding occurs',
      '🚫 Never walk or drive through flood waters',
      '📻 Monitor official updates',
    ];
  } else if (riskLevel === 'high') {
    return [
      '📦 Move valuables to higher ground',
      '🚗 Park vehicles in elevated areas',
      '🎒 Prepare emergency supplies',
      '📱 Keep phone charged',
      '🚫 Avoid low-lying areas',
      '📻 Stay informed through official channels',
    ];
  } else {
    return [
      '⚠️ Stay alert to weather updates',
      '📦 Secure outdoor items',
      '🚗 Avoid unnecessary travel',
      '📱 Keep emergency contacts ready',
    ];
  }
};

// Generate unique alert ID
const generateAlertId = () => {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Simulate alert generation (for testing/demo)
export const simulateAlert = (type = 'random', location = 'Delhi') => {
  let alert;
  
  const alertType = type === 'random' 
    ? Object.values(ALERT_TYPES)[Math.floor(Math.random() * 3)]
    : type;
  
  switch (alertType) {
    case ALERT_TYPES.AQI:
      const aqi = Math.floor(Math.random() * 400) + 50;
      alert = createAQIAlert(location, aqi, 'PM2.5');
      break;
    case ALERT_TYPES.HEATWAVE:
      const temp = Math.floor(Math.random() * 15) + 35;
      alert = createHeatwaveAlert(location, temp);
      break;
    case ALERT_TYPES.FLOOD:
      const risks = ['moderate', 'high', 'extreme', 'severe'];
      const risk = risks[Math.floor(Math.random() * risks.length)];
      alert = createFloodAlert(location, risk, '150mm in 24 hours');
      break;
    default:
      alert = createAQIAlert(location, 150, 'PM2.5');
  }
  
  emitAlert(alert, `location:${location}`);
  return alert;
};
