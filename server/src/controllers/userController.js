import cloudinary from '../config/cloudinary.js'

import {
  syncUser,
  updateUserPhotoURL,
} from '../models/userModel.js'

// ============================================================
// SYNC USER
// Used during Firebase Google login
// ============================================================

export async function syncUserController(
  req,
  res,
  next
) {
  try {
    const {
      firebaseUid,
      email,
      displayName,
      photoURL,
    } = req.body

    if (!firebaseUid || !email) {
      return res.status(400).json({
        status: 'error',
        message:
          'firebaseUid and email are required',
      })
    }

    const user = await syncUser({
      firebaseUid,
      email,
      displayName,
      photoURL,
    })

    return res.status(200).json({
      status: 'ok',
      message: 'User synced successfully',

      user: {
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        accessStatus: user.accessStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================
// UPDATE PROFILE PHOTO
// Upload image to Cloudinary
// Then save Cloudinary URL in MongoDB
// ============================================================

export async function updateProfilePhotoController(
  req,
  res,
  next
) {
  try {
    const { firebaseUid } = req.body

    if (!firebaseUid) {
      return res.status(400).json({
        status: 'error',
        message: 'firebaseUid is required',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Profile image is required',
      })
    }

    // ========================================================
    // UPLOAD IMAGE BUFFER TO CLOUDINARY
    // ========================================================

    const uploadResult =
      await new Promise((resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: 'friendship-vault/profiles',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error)
                return
              }

              resolve(result)
            }
          )

        uploadStream.end(req.file.buffer)
      })

    // ========================================================
    // SAVE CLOUDINARY URL TO MONGODB
    // ========================================================

    const user = await updateUserPhotoURL(
      firebaseUid,
      uploadResult.secure_url
    )

    return res.status(200).json({
      status: 'ok',
      message:
        'Profile photo updated successfully',

      user: {
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        accessStatus: user.accessStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
}