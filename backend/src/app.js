import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import apiRoutes from './routes/index.js'
import { notFoundHandler } from './middlewares/notFound.middleware.js'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'EcoSphere API is healthy' })
})

app.use('/api/v1', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app