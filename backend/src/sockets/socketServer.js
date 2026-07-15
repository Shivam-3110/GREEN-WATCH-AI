import { Server } from 'socket.io'
import { checkAQIForUser } from '../services/aqiMonitor.service.js'

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

    socket.on('alerts:subscribe', (data) => {
      const { userId, location } = data
      socket.join(`user:${userId}`)
      if (location) socket.join(`location:${location}`)
      console.log(`📍 User ${userId} subscribed to alerts for ${location}`)
    })

    const checked = new Set(); // guard against duplicate aqi:check from same socket

    socket.on('aqi:check', async ({ lat, lon, city }) => {
      if (checked.has(socket.id)) return;
      checked.add(socket.id);
      console.log(`🔍 AQI check requested by ${socket.id} for ${city}`)
      await checkAQIForUser(socket.id, lat, lon, city, socket)
    })

    socket.on('alerts:unsubscribe', (data) => {
      const { userId, location } = data
      socket.leave(`user:${userId}`)
      if (location) socket.leave(`location:${location}`)
    })

    socket.on('aqi:subscribe', (locationId) => {
      socket.join(`aqi:${locationId}`)
    })

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