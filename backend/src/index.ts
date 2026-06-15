import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { MODEL } from './gemini.js'
import { chatRouter } from './routes/chat.js'
import { stationsRouter } from './routes/stations.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
const port = Number(process.env.PORT) || 8000

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://travel-agent-chat.netlify.app',
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin))

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    has_api_key: Boolean(process.env.GEMINI_API_KEY),
  })
})

app.use('/api', chatRouter)
app.use('/api', stationsRouter)

app.listen(port, () => {
  console.log(`Travel Agent API listening on http://localhost:${port}`)
})
