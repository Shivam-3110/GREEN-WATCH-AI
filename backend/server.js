import 'dotenv/config'
import http from 'http'
import app from './src/app.js'
import connectDB from './src/config/db.js'
import { initSocket } from './src/sockets/socketServer.js'

const port = process.env.PORT || 5000
const server = http.createServer(app)

initSocket(server)

const startServer = async () => {
  try {
    await connectDB()
    server.listen(port, () => {
      console.log(`API server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()