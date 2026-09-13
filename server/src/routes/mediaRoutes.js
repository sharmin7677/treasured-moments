import express from 'express'

import {
  uploadMedia,
  getAllMedia,
  getMediaByType,
  getMediaByMediaType,
  updateMedia,
  deleteMedia,
} from '../controllers/mediaController.js'

import upload from '../middleware/upload.js'

import {
  verifyFirebaseToken,
  requireAdmin,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// ============================================================
// GET ALL MEDIA
// GET /api/media
//
// LOGGED-IN USERS ONLY
//
// Returns all media:
// - Memories
// - Photos
// - Quote Images
// - Videos
//
// Newest media first
// ============================================================

router.get(
  '/',
  verifyFirebaseToken,
  getAllMedia
)

// ============================================================
// GET MEDIA BY RESOURCE TYPE
//
// GET /api/media/type/image
// GET /api/media/type/video
//
// LOGGED-IN USERS ONLY
//
// resourceType:
// - image
// - video
//
// This checks the actual uploaded file type.
//
// IMPORTANT:
// This endpoint does NOT distinguish between:
// - photo
// - memory
// - quote
//
// For category-specific data, use:
// /api/media/category/:mediaType
// ============================================================

router.get(
  '/type/:resourceType',
  verifyFirebaseToken,
  getMediaByType
)

// ============================================================
// GET MEDIA BY MEDIA TYPE / CATEGORY
//
// GET /api/media/category/memory
// GET /api/media/category/photo
// GET /api/media/category/quote
// GET /api/media/category/video
//
// LOGGED-IN USERS ONLY
//
// mediaType:
// - memory → Normal memory photos
// - photo  → Photo collection
// - quote  → Quote images
// - video  → Videos
//
// IMPORTANT:
//
// /category/photo
//      ↓
// Only media uploaded with:
// mediaType = "photo"
//
// /category/memory
//      ↓
// Only media uploaded with:
// mediaType = "memory"
//
// This keeps Photo and Memory collections separate.
//
// Used by:
// - Home Latest Memories
// - Home Photo Strip
// - Home Quote Image section
// - Photos page
// - Videos page
// - Admin Manage Memories
// - Admin Manage Photos
// - Admin Manage Quote Images
// - Admin Manage Videos
// ============================================================

router.get(
  '/category/:mediaType',
  verifyFirebaseToken,
  getMediaByMediaType
)

// ============================================================
// UPLOAD MEDIA
// POST /api/media/upload
//
// ADMIN ONLY
//
// FormData:
// - media       → image/video file
// - title       → media title
// - description → media description
// - mediaType   → memory / photo / quote / video
//
// SIZE LIMITS:
// - Image → 10 MB
// - Video → 100 MB
//
// FLOW:
//
// Firebase Token
//       ↓
// Admin Verification
//       ↓
// Multer
//       ↓
// File Size Validation
//       ↓
// Cloudinary
//       ↓
// MongoDB
//
// IMPORTANT:
//
// The mediaType value determines which collection/category
// the uploaded media belongs to.
//
// memory
// photo
// quote
// video
// ============================================================

router.post(
  '/upload',
  verifyFirebaseToken,
  requireAdmin,
  upload.single('media'),
  uploadMedia
)

// ============================================================
// UPDATE MEDIA
// PUT /api/media/:id
//
// ADMIN ONLY
//
// Used by Admin Dashboard.
//
// Admin can edit:
// - Title
// - Description
//
// The existing Cloudinary media file remains unchanged.
//
// Body:
//
// {
//   title,
//   description
// }
//
// Media category/type is not changed here.
// ============================================================

router.put(
  '/:id',
  verifyFirebaseToken,
  requireAdmin,
  updateMedia
)

// ============================================================
// DELETE MEDIA
// DELETE /api/media/:id
//
// ADMIN ONLY
//
// Used by Admin Dashboard.
//
// Deletes:
// 1. Media document from MongoDB
// 2. Corresponding file from Cloudinary
//
// Admin can delete:
// - Memory
// - Photo
// - Quote Image
// - Video
// ============================================================

router.delete(
  '/:id',
  verifyFirebaseToken,
  requireAdmin,
  deleteMedia
)

// ============================================================
// EXPORT
// ============================================================

export default router