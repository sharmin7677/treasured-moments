
import { getAuth } from 'firebase-admin/auth'

import { firebaseAdmin } from '../config/firebaseAdmin.js'
import { getDb } from '../config/db.js'

// ============================================================
// VERIFY FIREBASE ID TOKEN
// ============================================================

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is required',
      })
    }

    const idToken = authHeader.substring(7).trim()

    if (!idToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is missing',
      })
    }

    // Firebase Admin Authentication
    const adminAuth = getAuth(firebaseAdmin)

    const decodedToken =
      await adminAuth.verifyIdToken(idToken)

    // Store verified Firebase user on request
    req.firebaseUser = decodedToken

    next()
  } catch (error) {
    console.error(
      '❌ Firebase token verification failed'
    )

    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token',
    })
  }
}

// ============================================================
// REQUIRE ADMIN
// ============================================================

export async function requireAdmin(req, res, next) {
  try {
    if (!req.firebaseUser?.uid) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
    }

    const db = getDb()

    const user = await db.collection('users').findOne(
      {
        firebaseUid: req.firebaseUser.uid,
      },
      {
        projection: {
          _id: 0,
          firebaseUid: 1,
          role: 1,
          email: 1,
          displayName: 1,
        },
      }
    )

    if (!user) {
      return res.status(403).json({
        status: 'error',
        message: 'User account not found',
      })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      })
    }

    req.currentUser = user

    next()
  } catch (error) {
    console.error(
      '❌ Admin authorization failed:',
      error.message
    )

    return res.status(500).json({
      status: 'error',
      message: 'Failed to verify admin access',
    })
  }
}

