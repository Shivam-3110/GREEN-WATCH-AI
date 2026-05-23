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
    console.log(`Socket connected: ${socket.id}`)

    socket.on('aqi:subscribe', (locationId) => {
      socket.join(`aqi:${locationId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized yet')
  }
  return io
}