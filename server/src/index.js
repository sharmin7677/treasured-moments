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

app.use(cors())

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
    await connectDatabase()

    app.listen(
      serverConfig.port,
      () => {
        console.log(
          `🎉 Friendship Vault API running on http://localhost:${serverConfig.port}`
        )

        console.log(
          `📍 Health check: http://localhost:${serverConfig.port}/api/health`
        )

        console.log(
          `🔔 Notifications API: http://localhost:${serverConfig.port}/api/notifications`
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


startServer()