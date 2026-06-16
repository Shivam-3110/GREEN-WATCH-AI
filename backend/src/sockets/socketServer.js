import { Server } from 'socket.io'

let io

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`)

    // Subscribe to location-based alerts
    socket.on('alerts:subscribe', (data) => {
      const { userId, location } = data
      socket.join(`user:${userId}`)
      if (location) {
        socket.join(`location:${location}`)
      }
      console.log(`📍 User ${userId} subscribed to alerts`)
    })

    // Unsubscribe from alerts
    socket.on('alerts:unsubscribe', (data) => {
      const { userId, location } = data
      socket.leave(`user:${userId}`)
      if (location) {
        socket.leave(`location:${location}`)
      }
    })

    // AQI subscription
    socket.on('aqi:subscribe', (locationId) => {
      socket.join(`aqi:${locationId}`)
      console.log(`🌬️ Subscribed to AQI updates for ${locationId}`)
    })

    // Alert acknowledgment
    socket.on('alert:acknowledge', (alertId) => {
      console.log(`✓ Alert ${alertId} acknowledged by ${socket.id}`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`)
    })
  })

  console.log('🔌 Socket.IO initialized')
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized yet')
  }
  return io
}