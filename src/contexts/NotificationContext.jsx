import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const checkedRef = useRef(false); // prevent double-emit from StrictMode

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    socketService.connect(
      () => setIsConnected(true),
      () => setIsConnected(false)
    );
    const userId = localStorage.getItem('userId') || 'guest';

    getLocationCoordinates().then(({ lat, lon, city }) => {
      const location = city || localStorage.getItem('userLocation') || 'Delhi';
      socketService.subscribeToAlerts(userId, location);

      const emitCheck = () => socketService.socket?.emit('aqi:check', { lat, lon, city: location });
      if (socketService.getConnectionStatus()) {
        emitCheck();
      } else {
        socketService.socket?.once('connect', emitCheck);
      }
    });

    return () => {};
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
