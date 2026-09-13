import { Router } from 'express'

import {
  verifyFirebaseToken,
} from '../middleware/authMiddleware.js'

import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from '../controllers/notificationsController.js'

const router = Router()

// ============================================================
// GET USER NOTIFICATIONS
// GET /api/notifications
//
// LOGGED-IN USER ONLY
// ============================================================

router.get(
  '/',
  verifyFirebaseToken,
  getNotificationsController
)

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
//
// LOGGED-IN USER ONLY
// ============================================================

router.get(
  '/unread-count',
  verifyFirebaseToken,
  getUnreadNotificationCountController
)

// ============================================================
// MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:notificationId/read
//
// LOGGED-IN USER ONLY
// ============================================================

router.put(
  '/:notificationId/read',
  verifyFirebaseToken,
  markNotificationAsReadController
)

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
//
// LOGGED-IN USER ONLY
// ============================================================

router.put(
  '/read-all',
  verifyFirebaseToken,
  markAllNotificationsAsReadController
)

export default router