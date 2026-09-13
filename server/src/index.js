import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { serverConfig } from './config/server.js'
import { connectDatabase } from './config/db.js'

import healthRouter from './routes/health.js'
import usersRouter from './routes/users.js'
import accessRouter from './routes/access.js'
import mediaRoutes from './routes/mediaRoutes.js'
import notificationsRouter from './routes/notifications.js'

import { errorHandler } from './middleware/errorHandler.js'


// ============================================================
// EXPRESS APP
// ============================================================

const app = express()


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

// CORS
app.use(cors())

// JSON body parser
app.use(express.json())


// ============================================================
// API ROUTES
// ============================================================

// Health
app.use(
  '/api/health',
  healthRouter
)


// Users
app.use(
  '/api/users',
  usersRouter
)


// Access Requests
app.use(
  '/api/access',
  accessRouter
)


// Media
app.use(
  '/api/media',
  mediaRoutes
)


// Notifications
app.use(
  '/api/notifications',
  notificationsRouter
)


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler)


// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    // Connect MongoDB first
    await connectDatabase()

    // Render provides PORT automatically.
    // For local development, fallback to serverConfig.port.
    const PORT = process.env.PORT || serverConfig.port

    // Listen on 0.0.0.0 so Render can access the server.
    app.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          `🎉 Friendship Vault API running on port ${PORT}`
        )

        console.log(
          `📍 Health check: /api/health`
        )

        console.log(
          `🔔 Notifications API: /api/notifications`
        )
      }
    )

  } catch (error) {
    console.error(
      '❌ Server startup failed:',
      error.message
    )

    process.exit(1)
  }
}


// ============================================================
// RUN SERVER
// ============================================================

startServer()