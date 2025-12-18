import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config/connectdb.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const port = process.env.PORT || 8000
const DATABASE_URL = process.env.DATABASE_URL

// ✅ FIXED CORS CONFIG (IMPORTANT)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://user-authentication-system-phi.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

// ✅ VERY IMPORTANT: allow preflight requests
app.options("*", cors())

// JSON Middleware (must be before routes)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database Connection
connectDB(DATABASE_URL)

// Routes
app.use("/api/user", userRoutes)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
