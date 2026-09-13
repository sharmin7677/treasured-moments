import { getDb } from '../config/db.js'

const USERS_COLLECTION = 'users'

// ============================================================
// CREATE USERS INDEX
// ============================================================

export async function createUsersIndex() {
  const db = getDb()

  await db.collection(USERS_COLLECTION).createIndex(
    { firebaseUid: 1 },
    { unique: true }
  )
}

// ============================================================
// FIND USER
// ============================================================

export async function findUserByFirebaseUid(firebaseUid) {
  const db = getDb()

  return db.collection(USERS_COLLECTION).findOne({
    firebaseUid,
  })
}

// ============================================================
// SYNC USER
// Used during Firebase Google login
// ============================================================

export async function syncUser({
  firebaseUid,
  email,
  displayName,
  photoURL,
}) {
  const db = getDb()
  const now = new Date()

  await db.collection(USERS_COLLECTION).updateOne(
    { firebaseUid },
    {
      $set: {
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        updatedAt: now,
      },

      $setOnInsert: {
        firebaseUid,
        role: 'visitor',
        accessStatus: 'none',
        createdAt: now,
      },
    },
    { upsert: true }
  )

  return findUserByFirebaseUid(firebaseUid)
}

// ============================================================
// UPDATE USER PROFILE PHOTO
// Used when user changes profile picture
// ============================================================

export async function updateUserPhotoURL(
  firebaseUid,
  photoURL
) {
  const db = getDb()

  const result = await db
    .collection(USERS_COLLECTION)
    .updateOne(
      { firebaseUid },
      {
        $set: {
          photoURL,
          updatedAt: new Date(),
        },
      }
    )

  if (result.matchedCount === 0) {
    throw new Error('User not found')
  }

  return findUserByFirebaseUid(firebaseUid)
}