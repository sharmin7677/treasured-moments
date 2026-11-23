import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { auth } from '../firebase/firebase.init.js'

import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'firebase/auth'

const AuthContext = createContext(null)

const API_URL = 'https://treasured-moments.vercel.app'

// ============================================================
// SYNC USER WITH BACKEND
// Used during Firebase Google login
// ============================================================

async function syncUserWithBackend(authUser) {
  try {
    const response = await fetch(
      `${API_URL}/api/users/sync`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || 'Failed to sync user'
      )
    }

    console.log(
      '✅ User synced with MongoDB:',
      data.user
    )

    return data.user
  } catch (error) {
    console.error(
      '❌ User sync failed:',
      error.message
    )

    return null
  }
}

// ============================================================
// UPDATE PROFILE PHOTO
// Backend → Cloudinary → MongoDB → Firebase
// ============================================================

async function updateProfilePhotoWithBackend(
  authUser,
  imageFile
) {
  try {
    if (!authUser) {
      throw new Error('User is not logged in')
    }

    if (!imageFile) {
      throw new Error('Please select an image')
    }

    // ========================================================
    // STEP 1 — VALIDATE IMAGE
    // ========================================================

    if (!imageFile.type.startsWith('image/')) {
      throw new Error(
        'Please select a valid image file'
      )
    }

    const maxFileSize = 5 * 1024 * 1024

    if (imageFile.size > maxFileSize) {
      throw new Error(
        'Profile photo must be 5 MB or smaller'
      )
    }

    // ========================================================
    // STEP 2 — PREPARE FORM DATA
    // ========================================================

    const formData = new FormData()

    formData.append(
      'profilePhoto',
      imageFile
    )

    formData.append(
      'firebaseUid',
      authUser.uid
    )

    // ========================================================
    // STEP 3 — SEND IMAGE TO BACKEND
    //
    // IMPORTANT:
    // No Cloudinary signature is generated here.
    // Backend handles Cloudinary upload.
    // ========================================================

    const response = await fetch(
      `${API_URL}/api/users/profile-photo`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message ||
          'Failed to update profile photo'
      )
    }

    // ========================================================
    // STEP 4 — GET CLOUDINARY URL FROM BACKEND
    // ========================================================

    const newPhotoURL =
      data.user?.photoURL

    if (!newPhotoURL) {
      throw new Error(
        'Profile photo URL was not returned by server'
      )
    }

    // ========================================================
    // STEP 5 — UPDATE FIREBASE PROFILE
    // ========================================================

    await updateProfile(authUser, {
      photoURL: newPhotoURL,
    })

    // ========================================================
    // STEP 6 — RELOAD FIREBASE USER
    // ========================================================

    await authUser.reload()

    const refreshedUser =
      auth.currentUser

    console.log(
      '✅ Profile photo updated successfully'
    )

    return {
      success: true,
      user: data.user,
      photoURL: newPhotoURL,
      firebaseUser: refreshedUser,
    }
  } catch (error) {
    console.error(
      '❌ Profile photo update failed:',
      error.message
    )

    throw error
  }
}

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ==========================================================
  // FIREBASE AUTH STATE
  // ==========================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (authUser) => {
          try {
            setUser(authUser)

            if (authUser) {
              await syncUserWithBackend(
                authUser
              )
            }
          } catch (error) {
            console.error(
              '❌ Auth state handling failed:',
              error
            )
          } finally {
            setLoading(false)
          }
        }
      )

    return () => unsubscribe()
  }, [])

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      await signOut(auth)

      setUser(null)
      setLoading(false)

      console.log(
        '✅ User logged out successfully'
      )
    } catch (error) {
      console.error(
        '❌ Logout failed:',
        error.message
      )

      throw error
    }
  }

  // ==========================================================
  // PROFILE PHOTO UPDATE
  // ==========================================================

  const updateProfilePhoto = async (
    imageFile
  ) => {
    if (!user) {
      throw new Error(
        'Please log in before changing your profile photo'
      )
    }

    const result =
      await updateProfilePhotoWithBackend(
        user,
        imageFile
      )

    // ======================================================
    // REFRESH LOCAL FIREBASE USER STATE
    // ======================================================

    await auth.currentUser?.reload()

    const refreshedUser =
      auth.currentUser

    setUser(refreshedUser)

    return result
  }

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    currentUser: user,
    loading,
    logout,
    updateProfilePhoto,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {
  return useContext(AuthContext)
}