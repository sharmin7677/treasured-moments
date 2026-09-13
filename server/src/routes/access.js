import { Router } from 'express'
import { getDb } from '../config/db.js'

import {
  verifyFirebaseToken,
  requireAdmin,
} from '../middleware/authMiddleware.js'

const router = Router()

// ============================================================
// REQUEST ACCESS
// POST /api/access/request
// ============================================================

router.post(
  '/request',
  async (req, res, next) => {
    try {
      const {
        firebaseUid,
        email,
        displayName,
        photoURL,
      } = req.body

      // ========================================================
      // VALIDATE FIREBASE UID
      // ========================================================

      if (!firebaseUid) {
        return res.status(400).json({
          status: 'error',
          message: 'Firebase UID is required',
        })
      }

      const db = getDb()

      // ========================================================
      // FIND USER
      // ========================================================

      const user = await db
        .collection('users')
        .findOne({
          firebaseUid,
        })

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        })
      }

      // ========================================================
      // ADMIN AUTOMATICALLY HAS FULL ACCESS
      // ========================================================

      if (user.role === 'admin') {
        return res.json({
          status: 'ok',
          message: 'Admin already has full access',
          accessStatus: 'approved',
        })
      }

      // ========================================================
      // ALREADY APPROVED
      // ========================================================

      if (user.accessStatus === 'approved') {
        return res.json({
          status: 'ok',
          message: 'Access is already approved',
          accessStatus: 'approved',
        })
      }

      // ========================================================
      // REQUEST ALREADY PENDING
      // ========================================================

      if (user.accessStatus === 'pending') {
        return res.json({
          status: 'ok',
          message:
            'Your access request is already pending',
          accessStatus: 'pending',
        })
      }

      // ========================================================
      // CREATE NEW REQUEST
      //
      // This also allows a previously rejected/revoked user
      // to request access again.
      // ========================================================

      const now = new Date()

      await db.collection('users').updateOne(
        {
          firebaseUid,
        },
        {
          $set: {
            email:
              email ||
              user.email ||
              '',

            displayName:
              displayName ||
              user.displayName ||
              '',

            photoURL:
              photoURL ||
              user.photoURL ||
              '',

            accessStatus: 'pending',

            accessRequestedAt: now,

            // Clear previous decision timestamps
            accessApprovedAt: null,
            accessRejectedAt: null,
            accessRevokedAt: null,

            updatedAt: now,
          },
        }
      )

      // ========================================================
      // FIND ADMIN
      // ========================================================

      const admin = await db
        .collection('users')
        .findOne({
          role: 'admin',
        })

      // ========================================================
      // CREATE ADMIN NOTIFICATION
      // ========================================================

      if (admin?.firebaseUid) {
        await db
          .collection('notifications')
          .insertOne({
            firebaseUid:
              admin.firebaseUid,

            type: 'access_request',

            title:
              'New Access Request 💌',

            message:
              `${displayName || user.displayName || 'A friend'} has requested access to The Friendship Vault.`,

            requestUserFirebaseUid:
              firebaseUid,

            requestUserEmail:
              email ||
              user.email ||
              '',

            requestUserDisplayName:
              displayName ||
              user.displayName ||
              '',

            requestUserPhotoURL:
              photoURL ||
              user.photoURL ||
              '',

            read: false,

            createdAt: now,
          })
      }

      // ========================================================
      // RESPONSE
      // ========================================================

      return res.json({
        status: 'ok',
        message:
          'Access request submitted successfully',
        accessStatus: 'pending',
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// GET CURRENT USER ACCESS STATUS
// GET /api/access/status/:firebaseUid
// ============================================================

router.get(
  '/status/:firebaseUid',
  async (req, res, next) => {
    try {
      const { firebaseUid } =
        req.params

      const db = getDb()

      const user = await db
        .collection('users')
        .findOne(
          {
            firebaseUid,
          },
          {
            projection: {
              _id: 0,

              firebaseUid: 1,
              role: 1,
              email: 1,
              displayName: 1,
              photoURL: 1,

              accessStatus: 1,
              accessRequestedAt: 1,
              accessApprovedAt: 1,
              accessRejectedAt: 1,
              accessRevokedAt: 1,
            },
          }
        )

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        })
      }

      const role =
        user.role || 'friend'

      // ========================================================
      // ADMIN ALWAYS HAS APPROVED ACCESS
      // ========================================================

      const accessStatus =
        role === 'admin'
          ? 'approved'
          : user.accessStatus || 'none'

      return res.json({
        status: 'ok',

        role,

        accessStatus,

        accessRequestedAt:
          user.accessRequestedAt ||
          null,

        accessApprovedAt:
          user.accessApprovedAt ||
          null,

        accessRejectedAt:
          user.accessRejectedAt ||
          null,

        accessRevokedAt:
          user.accessRevokedAt ||
          null,
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// GET ALL ACCESS REQUESTS
// GET /api/access/requests
//
// ADMIN ONLY
// ============================================================

router.get(
  '/requests',
  verifyFirebaseToken,
  requireAdmin,

  async (req, res, next) => {
    try {
      const db = getDb()

      const requests = await db
        .collection('users')
        .find(
          {
            role: {
              $ne: 'admin',
            },

            accessStatus: {
              $in: [
                'pending',
                'approved',
                'rejected',
                'revoked',
              ],
            },
          },

          {
            projection: {
              _id: 0,

              firebaseUid: 1,
              email: 1,
              displayName: 1,
              photoURL: 1,
              role: 1,

              accessStatus: 1,

              accessRequestedAt: 1,
              accessApprovedAt: 1,
              accessRejectedAt: 1,
              accessRevokedAt: 1,

              updatedAt: 1,
            },
          }
        )
        .sort({
          accessRequestedAt: -1,
        })
        .toArray()

      return res.json({
        status: 'ok',

        count: requests.length,

        requests,
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// APPROVE ACCESS
// PUT /api/access/approve/:firebaseUid
//
// ADMIN ONLY
// ============================================================

router.put(
  '/approve/:firebaseUid',
  verifyFirebaseToken,
  requireAdmin,

  async (req, res, next) => {
    try {
      const { firebaseUid } =
        req.params

      const db = getDb()

      const user = await db
        .collection('users')
        .findOne({
          firebaseUid,
        })

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        })
      }

      // ======================================================
      // ADMIN CANNOT BE MANUALLY APPROVED
      // ======================================================

      if (user.role === 'admin') {
        return res.json({
          status: 'ok',
          message:
            'Admin already has full access',
          accessStatus: 'approved',
        })
      }

      // ======================================================
      // ALREADY APPROVED
      // ======================================================

      if (user.accessStatus === 'approved') {
        return res.json({
          status: 'ok',
          message:
            'User already has approved access',
          accessStatus: 'approved',
        })
      }

      const now = new Date()

      // ======================================================
      // UPDATE USER ACCESS STATUS
      // ======================================================

      await db
        .collection('users')
        .updateOne(
          {
            firebaseUid,
          },
          {
            $set: {
              accessStatus: 'approved',

              accessApprovedAt: now,

              accessRejectedAt: null,

              accessRevokedAt: null,

              updatedAt: now,
            },
          }
        )

      // ======================================================
      // CREATE APPROVAL NOTIFICATION
      // FRIEND
      // ======================================================

      await db
        .collection('notifications')
        .insertOne({
          firebaseUid,

          type: 'access_approved',

          title:
            'Access Approved ❤️',

          message:
            'Your request to explore the private memories has been approved. Welcome to The Friendship Vault! ❤️',

          read: false,

          createdAt: now,
        })

      return res.json({
        status: 'ok',

        message:
          'Access approved successfully',

        accessStatus: 'approved',
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// REJECT ACCESS
// PUT /api/access/reject/:firebaseUid
//
// ADMIN ONLY
// ============================================================

router.put(
  '/reject/:firebaseUid',
  verifyFirebaseToken,
  requireAdmin,

  async (req, res, next) => {
    try {
      const { firebaseUid } =
        req.params

      const db = getDb()

      const user = await db
        .collection('users')
        .findOne({
          firebaseUid,
        })

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        })
      }

      // ======================================================
      // ADMIN CANNOT BE REJECTED
      // ======================================================

      if (user.role === 'admin') {
        return res.status(400).json({
          status: 'error',
          message:
            'Admin access cannot be rejected',
        })
      }

      const now = new Date()

      // ======================================================
      // UPDATE USER ACCESS STATUS
      // ======================================================

      await db
        .collection('users')
        .updateOne(
          {
            firebaseUid,
          },
          {
            $set: {
              accessStatus: 'rejected',

              accessRejectedAt: now,

              accessApprovedAt: null,

              accessRevokedAt: null,

              updatedAt: now,
            },
          }
        )

      // ======================================================
      // CREATE REJECTION NOTIFICATION
      // FRIEND
      // ======================================================

      await db
        .collection('notifications')
        .insertOne({
          firebaseUid,

          type: 'access_rejected',

          title:
            'Access Request Update',

          message:
            'Your request to explore the private memories was not approved at this time.',

          read: false,

          createdAt: now,
        })

      return res.json({
        status: 'ok',

        message:
          'Access rejected successfully',

        accessStatus: 'rejected',
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// REVOKE ACCESS
// PUT /api/access/revoke/:firebaseUid
//
// ADMIN ONLY
//
// Used when a user was previously approved but the admin
// decides to remove their private-content access later.
// ============================================================

router.put(
  '/revoke/:firebaseUid',
  verifyFirebaseToken,
  requireAdmin,

  async (req, res, next) => {
    try {
      const { firebaseUid } =
        req.params

      const db = getDb()

      // ======================================================
      // FIND USER
      // ======================================================

      const user = await db
        .collection('users')
        .findOne({
          firebaseUid,
        })

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        })
      }

      // ======================================================
      // ADMIN CANNOT BE REVOKED
      // ======================================================

      if (user.role === 'admin') {
        return res.status(400).json({
          status: 'error',
          message:
            'Admin access cannot be revoked',
        })
      }

      // ======================================================
      // USER MUST CURRENTLY BE APPROVED
      // ======================================================

      if (user.accessStatus !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message:
            'Only an approved user can have access revoked',
        })
      }

      const now = new Date()

      // ======================================================
      // UPDATE USER ACCESS STATUS
      // ======================================================

      await db
        .collection('users')
        .updateOne(
          {
            firebaseUid,
          },
          {
            $set: {
              accessStatus: 'revoked',

              accessRevokedAt: now,

              accessApprovedAt: null,

              updatedAt: now,
            },
          }
        )

      // ======================================================
      // CREATE REVOCATION NOTIFICATION
      // FRIEND
      // ======================================================

      await db
        .collection('notifications')
        .insertOne({
          firebaseUid,

          type: 'access_revoked',

          title:
            'Access Revoked',

          message:
            'Your access to the private memories has been revoked by the administrator.',

          read: false,

          createdAt: now,
        })

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.json({
        status: 'ok',

        message:
          'User access revoked successfully',

        accessStatus: 'revoked',
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router