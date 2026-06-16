import {
  createAQIAlert,
  createHeatwaveAlert,
  createFloodAlert,
  emitAlert,
  simulateAlert,
  ALERT_TYPES,
} from '../services/environmentalAlert.service.js';

// Trigger AQI alert
export const triggerAQIAlert = async (req, res) => {
  try {
    const { location, aqi, pollutant } = req.body;

    if (!location || !aqi) {
      return res.status(400).json({
        success: false,
        message: 'Location and AQI are required',
      });
    }

    const alert = createAQIAlert(location, aqi, pollutant);
    const emitted = emitAlert(alert, `location:${location}`);

    res.status(200).json({
      success: true,
      message: 'AQI alert triggered successfully',
      data: { alert, emitted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger AQI alert',
      error: error.message,
    });
  }
};

// Trigger heatwave alert
export const triggerHeatwaveAlert = async (req, res) => {
  try {
    const { location, temperature, duration } = req.body;

    if (!location || !temperature) {
      return res.status(400).json({
        success: false,
        message: 'Location and temperature are required',
      });
    }

    const alert = createHeatwaveAlert(location, temperature, duration);
    const emitted = emitAlert(alert, `location:${location}`);

    res.status(200).json({
      success: true,
      message: 'Heatwave alert triggered successfully',
      data: { alert, emitted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger heatwave alert',
      error: error.message,
    });
  }
};

// Trigger flood alert
export const triggerFloodAlert = async (req, res) => {
  try {
    const { location, riskLevel, rainfall } = req.body;

    if (!location || !riskLevel) {
      return res.status(400).json({
        success: false,
        message: 'Location and risk level are required',
      });
    }

    const alert = createFloodAlert(location, riskLevel, rainfall);
    const emitted = emitAlert(alert, `location:${location}`);

    res.status(200).json({
      success: true,
      message: 'Flood alert triggered successfully',
      data: { alert, emitted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger flood alert',
      error: error.message,
    });
  }
};

// Get alert types
export const getAlertTypes = async (_req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        types: Object.values(ALERT_TYPES),
        severityLevels: ['info', 'warning', 'critical', 'emergency'],
        categories: [
          { type: 'aqi', name: 'Air Quality Index', icon: '🌬️' },
          { type: 'heatwave', name: 'Heatwave', icon: '🌡️' },
          { type: 'flood', name: 'Flood', icon: '🌊' },
          { type: 'storm', name: 'Storm', icon: '⛈️' },
          { type: 'wildfire', name: 'Wildfire', icon: '🔥' },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert types',
      error: error.message,
    });
  }
};

// Simulate alert (for testing)
export const triggerTestAlert = async (req, res) => {
  try {
    const { type, location } = req.body;

    const alert = simulateAlert(type || 'random', location || 'Delhi');

    res.status(200).json({
      success: true,
      message: 'Test alert triggered successfully',
      data: { alert },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger test alert',
      error: error.message,
    });
  }
};
