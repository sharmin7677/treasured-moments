
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { serverConfig } from './config/server.js';
import { connectDatabase } from './config/db.js';

import healthRouter from './routes/health.js';
import usersRouter from './routes/users.js';
import accessRouter from './routes/access.js';
import mediaRoutes from './routes/mediaRoutes.js';
import notificationsRouter from './routes/notifications.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Health API
// Keep health check independent of MongoDB.
app.use('/api/health', healthRouter);

// Connect MongoDB before other API requests.
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/access', accessRouter);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationsRouter);

// Error handler
app.use(errorHandler);

// Local development server only
if (!process.env.VERCEL) {
  async function startServer() {
    try {
      await connectDatabase();

      const PORT = serverConfig.port;

      app.listen(PORT, '0.0.0.0', () => {
        console.log(
          `Friendship Vault API running on port ${PORT}`
        );
        console.log(`Health check: /api/health`);
      });
    } catch (error) {
      console.error('Server startup failed:', error.message);
      process.exit(1);
    }
  }

  startServer();
}

// Export Express app for Vercel
export default app;
