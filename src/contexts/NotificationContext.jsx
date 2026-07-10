import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { getLocationCoordinates } from '../utils/location';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts]           = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.connect();

    const userId = localStorage.getItem('userId') || 'guest';

    // Subscribe to user's real location city and trigger one-time AQI check
    getLocationCoordinates().then(({ lat, lon, city }) => {
      const location = city || localStorage.getItem('userLocation') || 'Delhi'
      socketService.subscribeToAlerts(userId, location)
      // Emit once — backend fetches AQI and fires alert if threshold crossed
      socketService.socket?.emit('aqi:check', { lat, lon, city: location })
    })

    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = socketService.onAlert((alert) => addAlert(alert));
    return unsubscribe;
  }, []);

  const addAlert = useCallback((alert) => {
    setAlerts(prev => {
      if (prev.some(a => a.id === alert.id)) return prev;
      return [alert, ...prev];
    });
    if (alert.expiresAt) {
      const expiryTime = new Date(alert.expiresAt).getTime() - Date.now();
      if (expiryTime > 0) setTimeout(() => removeAlert(alert.id), expiryTime);
    }
  }, []);

  const removeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    socketService.acknowledgeAlert(alertId);
  }, []);

  const clearAllAlerts = useCallback(() => {
    alerts.forEach(a => socketService.acknowledgeAlert(a.id));
    setAlerts([]);
  }, [alerts]);

  return (
    <NotificationContext.Provider value={{ alerts, isConnected, addAlert, removeAlert, clearAllAlerts }}>
      {children}
    </NotificationContext.Provider>
  );
};
