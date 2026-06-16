import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect socket
    socketService.connect();

    // Subscribe to alerts
    const userId = localStorage.getItem('userId') || 'guest';
    const location = localStorage.getItem('userLocation') || 'Delhi';
    socketService.subscribeToAlerts(userId, location);

    // Listen for connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(checkConnection);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Subscribe to alert notifications
    const unsubscribe = socketService.onAlert((alert) => {
      addAlert(alert);
    });

    return unsubscribe;
  }, []);

  const addAlert = useCallback((alert) => {
    setAlerts(prev => {
      // Avoid duplicates
      if (prev.some(a => a.id === alert.id)) {
        return prev;
      }
      return [alert, ...prev];
    });

    // Auto-remove after expiry
    if (alert.expiresAt) {
      const expiryTime = new Date(alert.expiresAt).getTime() - Date.now();
      if (expiryTime > 0) {
        setTimeout(() => {
          removeAlert(alert.id);
        }, expiryTime);
      }
    }
  }, []);

  const removeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    socketService.acknowledgeAlert(alertId);
  }, []);

  const clearAllAlerts = useCallback(() => {
    alerts.forEach(alert => socketService.acknowledgeAlert(alert.id));
    setAlerts([]);
  }, [alerts]);

  const value = {
    alerts,
    isConnected,
    addAlert,
    removeAlert,
    clearAllAlerts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
