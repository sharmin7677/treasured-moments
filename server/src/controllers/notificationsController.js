import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

// ============================================================
// GET FIREBASE UID
// ============================================================

function getFirebaseUid(req) {
  return (
    req.firebaseUser?.uid ||
    req.user?.uid ||
    null
  )
}

// ============================================================
// GET USER NOTIFICATIONS
// GET /api/notifications
//
// LOGGED-IN USER ONLY
// ============================================================

export async function getNotificationsController(
  req,
  res,
  next
) {
  try {
    const firebaseUid =
      getFirebaseUid(req)

    if (!firebaseUid) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
    }

    const db = getDb()

    const notifications = await db
      .collection('notifications')
      .find({
        firebaseUid,
      })
      .sort({
        createdAt: -1,
      })
      .toArray()

    const unreadCount =
      notifications.filter(
        (notification) =>
          notification.read !== true
      ).length

    return res.status(200).json({
      status: 'ok',

      count:
        notifications.length,

      unreadCount,

      notifications,
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
//
// LOGGED-IN USER ONLY
// ============================================================

export async function getUnreadNotificationCountController(
  req,
  res,
  next
) {
  try {
    const firebaseUid =
      getFirebaseUid(req)

    if (!firebaseUid) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
    }

    const db = getDb()

    const unreadCount =
      await db
        .collection('notifications')
        .countDocuments({
          firebaseUid,

          read: false,
        })

    return res.status(200).json({
      status: 'ok',

      unreadCount,
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================
// MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:notificationId/read
//
// LOGGED-IN USER ONLY
// ============================================================

export async function markNotificationAsReadController(
  req,
  res,
  next
) {
  try {
    const firebaseUid =
      getFirebaseUid(req)

    const {
      notificationId,
    } = req.params

    if (!firebaseUid) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
    }

    if (!notificationId) {
      return res.status(400).json({
        status: 'error',
        message:
          'Notification ID is required',
      })
    }

    // ========================================================
    // VALIDATE MONGODB OBJECT ID
    // ========================================================

    if (
      !ObjectId.isValid(
        notificationId
      )
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Invalid notification ID',
      })
    }

    const db = getDb()

    const result = await db
      .collection('notifications')
      .updateOne(
        {
          _id:
            new ObjectId(
              notificationId
            ),

          // ==================================================
          // USER CAN ONLY MODIFY THEIR OWN NOTIFICATION
          // ==================================================

          firebaseUid,

          // ==================================================
          // ONLY UPDATE UNREAD NOTIFICATIONS
          // ==================================================

          read: false,
        },
        {
          $set: {
            read: true,

            readAt: new Date(),
          },
        }
      )

    if (
      result.matchedCount === 0
    ) {
      return res.status(404).json({
        status: 'error',
        message:
          'Notification not found or already marked as read',
      })
    }

    return res.status(200).json({
      status: 'ok',

      message:
        'Notification marked as read',
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
//
// LOGGED-IN USER ONLY
// ============================================================

export async function markAllNotificationsAsReadController(
  req,
  res,
  next
) {
  try {
    const firebaseUid =
      getFirebaseUid(req)

    if (!firebaseUid) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
    }

    const db = getDb()

    const result = await db
      .collection('notifications')
      .updateMany(
        {
          firebaseUid,

          read: false,
        },
        {
          $set: {
            read: true,

            readAt: new Date(),
          },
        }
      )

    return res.status(200).json({
      status: 'ok',

      message:
        'All notifications marked as read',

      modifiedCount:
        result.modifiedCount,
    })
  } catch (error) {
    next(error)
  }
}