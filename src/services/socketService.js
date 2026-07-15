import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.alertListeners = [];
  }

  connect(onConnect, onDisconnect) {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      onConnect?.();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('environmental:alert', (alert) => {
      this.notifyAlertListeners(alert);
    });

    this.socket.on('environmental:alerts:bulk', (alerts) => {
      alerts.forEach(alert => this.notifyAlertListeners(alert));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribeToAlerts(userId, location) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('alerts:subscribe', { userId, location });
    console.log(`📍 Subscribed to alerts for ${location}`);
  }

  unsubscribeFromAlerts(userId, location) {
    if (!this.socket) return;
    this.socket.emit('alerts:unsubscribe', { userId, location });
  }

  subscribeToAQI(locationId) {
    if (!this.socket) return;
    this.socket.emit('aqi:subscribe', locationId);
  }

  acknowledgeAlert(alertId) {
    if (!this.socket) return;
    this.socket.emit('alert:acknowledge', alertId);
  }

  // Add alert listener
  onAlert(callback) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(cb => cb !== callback);
    };
  }

  // Notify all alert listeners
  notifyAlertListeners(alert) {
    this.alertListeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    });
  }

  getConnectionStatus() {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
