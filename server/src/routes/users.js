import { Router } from 'express'

import {
  syncUserController,
  updateProfilePhotoController,
} from '../controllers/userController.js'

import upload from '../middleware/upload.js'

const router = Router()

// ============================================================
// SYNC USER
// ============================================================

router.put(
  '/sync',
  syncUserController
)

// ============================================================
// UPDATE PROFILE PHOTO
// ============================================================

router.post(
  '/profile-photo',
  upload.single('profilePhoto'),
  updateProfilePhotoController
)

export default router