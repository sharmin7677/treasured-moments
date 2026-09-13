import { ObjectId } from 'mongodb'

import uploadToCloudinary from '../services/cloudinaryUpload.js'
import { getDb } from '../config/db.js'
import cloudinary from '../config/cloudinary.js'
import createMediaDocument from '../models/Media.js'

// ============================================================
// FILE SIZE LIMITS
// ============================================================

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

// ============================================================
// VALID MEDIA TYPES
// ============================================================
//
// memory → Normal memory images
// photo  → Dedicated Photos collection
// quote  → Quote images
// video  → Videos
//
// ============================================================

const VALID_MEDIA_TYPES = [
  'memory',
  'photo',
  'quote',
  'video',
]

// ============================================================
// HELPER
// VALIDATE OBJECT ID
// ============================================================

const isValidObjectId = (id) => {
  return (
    typeof id === 'string' &&
    ObjectId.isValid(id)
  )
}

// ============================================================
// HELPER
// NORMALIZE MEDIA TYPE
// ============================================================

const normalizeMediaType = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

// ============================================================
// HELPER
// DELETE MEDIA FROM CLOUDINARY
// ============================================================

const deleteFromCloudinary = async ({
  publicId,
  resourceType,
}) => {
  if (!publicId) {
    return null
  }

  try {
    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            resourceType === 'video'
              ? 'video'
              : 'image',

          invalidate: true,
        }
      )

    return result
  } catch (error) {
    console.error(
      '❌ Cloudinary delete error:',
      error
    )

    throw error
  }
}

// ============================================================
// HELPER
// REMOVE DUPLICATE MEDIA
// ============================================================
//
// This protects frontend sections from showing the same
// uploaded Cloudinary file more than once.
//
// Priority:
// 1. publicId
// 2. url
// 3. MongoDB _id
//
// ============================================================

const removeDuplicateMedia = (
  media = []
) => {
  const seen = new Set()

  return media.filter((item) => {
    const uniqueKey =
      item.publicId ||
      item.url ||
      item._id?.toString()

    if (!uniqueKey) {
      return true
    }

    if (seen.has(uniqueKey)) {
      return false
    }

    seen.add(uniqueKey)

    return true
  })
}

// ============================================================
// UPLOAD MEDIA
// POST /api/media/upload
//
// ADMIN ONLY
//
// FormData:
// - media
// - mediaType
// - title
// - description
//
// mediaType:
// - memory
// - photo
// - quote
// - video
// ============================================================

const uploadMedia = async (
  req,
  res,
  next
) => {
  let uploadedCloudinaryPublicId = null
  let uploadedCloudinaryResourceType = null

  try {
    // ========================================================
    // CHECK FILE
    // ========================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'No image or video uploaded',
      })
    }

    // ========================================================
    // DETERMINE RESOURCE TYPE
    // ========================================================

    const resourceType =
      req.file.mimetype?.startsWith(
        'video/'
      )
        ? 'video'
        : 'image'

    // ========================================================
    // CHECK FILE SIZE
    // ========================================================

    if (
      resourceType === 'image' &&
      req.file.size > MAX_IMAGE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Image size cannot exceed 10 MB',
      })
    }

    if (
      resourceType === 'video' &&
      req.file.size > MAX_VIDEO_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Video size cannot exceed 100 MB',
      })
    }

    // ========================================================
    // GET MEDIA TYPE
    // ========================================================

    let mediaType =
      normalizeMediaType(
        req.body.mediaType
      )

    // ========================================================
    // DEFAULT MEDIA TYPE
    // ========================================================

    if (!mediaType) {
      mediaType =
        resourceType === 'video'
          ? 'video'
          : 'memory'
    }

    // ========================================================
    // VALID MEDIA TYPE
    // ========================================================

    if (
      !VALID_MEDIA_TYPES.includes(
        mediaType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid mediaType. Use memory, photo, quote, or video',
      })
    }

    // ========================================================
    // VIDEO MUST BE VIDEO CATEGORY
    // ========================================================

    if (
      resourceType === 'video' &&
      mediaType !== 'video'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Video upload must have mediaType set to video',
      })
    }

    // ========================================================
    // IMAGE CATEGORY VALIDATION
    // ========================================================

    if (
      resourceType === 'image' &&
      ![
        'memory',
        'photo',
        'quote',
      ].includes(mediaType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Image mediaType must be memory, photo or quote',
      })
    }

    // ========================================================
    // TITLE
    // ========================================================

    const title =
      typeof req.body.title === 'string'
        ? req.body.title.trim()
        : ''

    // ========================================================
    // DESCRIPTION
    // ========================================================

    const description =
      typeof req.body.description === 'string'
        ? req.body.description.trim()
        : ''

    // ========================================================
    // TITLE REQUIRED
    // ========================================================

    if (!title) {
      return res.status(400).json({
        success: false,
        message:
          'Media title is required',
      })
    }

    // ========================================================
    // UPLOADER INFORMATION
    // ========================================================

    const firebaseUser =
      req.firebaseUser

    const uploadedBy = firebaseUser
      ? {
          firebaseUid:
            firebaseUser.uid,

          email:
            firebaseUser.email || '',

          displayName:
            firebaseUser.name ||
            firebaseUser.displayName ||
            '',
        }
      : null

    // ========================================================
    // UPLOAD TO CLOUDINARY
    // ========================================================

    const result =
      await uploadToCloudinary(
        req.file.buffer,
        resourceType
      )

    uploadedCloudinaryPublicId =
      result.public_id

    uploadedCloudinaryResourceType =
      result.resource_type ||
      resourceType

    // ========================================================
    // SAFETY CHECK
    //
    // Prevent the same Cloudinary file from being stored
    // multiple times.
    // ========================================================

    const db = getDb()

    const existingMedia =
      await db
        .collection('media')
        .findOne({
          publicId:
            result.public_id,
        })

    if (existingMedia) {
      // ------------------------------------------------------
      // Uploaded file already exists.
      //
      // Delete the newly uploaded duplicate from Cloudinary.
      // ------------------------------------------------------

      try {
        await deleteFromCloudinary({
          publicId:
            result.public_id,

          resourceType:
            result.resource_type ||
            resourceType,
        })
      } catch (cleanupError) {
        console.error(
          '❌ Failed to cleanup duplicate Cloudinary file:',
          cleanupError
        )
      }

      return res.status(409).json({
        success: false,
        message:
          'This media file already exists.',
        data: existingMedia,
      })
    }

    // ========================================================
    // CREATE MEDIA DOCUMENT
    // ========================================================

    const mediaDocument =
      createMediaDocument({
        title,
        description,
        mediaType,

        url:
          result.secure_url,

        publicId:
          result.public_id,

        resourceType:
          result.resource_type ||
          resourceType,

        uploadedBy,
      })

    // ========================================================
    // SAVE TO MONGODB
    // ========================================================

    const insertResult =
      await db
        .collection('media')
        .insertOne(
          mediaDocument
        )

    // ========================================================
    // RESPONSE MESSAGE
    // ========================================================

    let successMessage =
      'Memory uploaded successfully'

    if (
      mediaType === 'photo'
    ) {
      successMessage =
        'Photo uploaded successfully'
    }

    if (
      mediaType === 'quote'
    ) {
      successMessage =
        'Quote image uploaded successfully'
    }

    if (
      mediaType === 'video'
    ) {
      successMessage =
        'Video uploaded successfully'
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        successMessage,

      data: {
        _id:
          insertResult.insertedId,

        title:
          mediaDocument.title,

        description:
          mediaDocument.description,

        mediaType:
          mediaDocument.mediaType,

        url:
          mediaDocument.url,

        publicId:
          mediaDocument.publicId,

        resourceType:
          mediaDocument.resourceType,

        uploadedBy:
          mediaDocument.uploadedBy,

        createdAt:
          mediaDocument.createdAt,

        updatedAt:
          mediaDocument.updatedAt,
      },
    })
  } catch (error) {
    console.error(
      '❌ Media upload error:',
      error
    )

    // ========================================================
    // CLEANUP CLOUDINARY IF MONGODB SAVE FAILS
    // ========================================================

    if (
      uploadedCloudinaryPublicId
    ) {
      try {
        await deleteFromCloudinary({
          publicId:
            uploadedCloudinaryPublicId,

          resourceType:
            uploadedCloudinaryResourceType,
        })
      } catch (cleanupError) {
        console.error(
          '❌ Failed to cleanup Cloudinary upload:',
          cleanupError
        )
      }
    }

    next(error)
  }
}

// ============================================================
// GET ALL MEDIA
// GET /api/media
//
// Returns:
// - memory
// - photo
// - quote
// - video
//
// Newest first.
// ============================================================

const getAllMedia = async (
  req,
  res,
  next
) => {
  try {
    const db = getDb()

    const media =
      await db
        .collection('media')
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray()

    const uniqueMedia =
      removeDuplicateMedia(
        media
      )

    return res.status(200).json({
      success: true,

      count:
        uniqueMedia.length,

      data:
        uniqueMedia,
    })
  } catch (error) {
    console.error(
      '❌ Failed to fetch media:',
      error
    )

    next(error)
  }
}

// ============================================================
// GET MEDIA BY RESOURCE TYPE
//
// GET /api/media/type/image
// GET /api/media/type/video
//
// IMPORTANT:
//
// /type/image returns:
// - memory
// - photo
// - quote
//
// So category-specific sections should use:
//
// /api/media/category/photo
// /api/media/category/memory
// /api/media/category/quote
//
// ============================================================

const getMediaByType = async (
  req,
  res,
  next
) => {
  try {
    const resourceType =
      normalizeMediaType(
        req.params.resourceType
      )

    // ========================================================
    // VALIDATE RESOURCE TYPE
    // ========================================================

    if (
      resourceType !== 'image' &&
      resourceType !== 'video'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Resource type must be image or video',
      })
    }

    // ========================================================
    // DATABASE
    // ========================================================

    const db = getDb()

    const media =
      await db
        .collection('media')
        .find({
          resourceType,
        })
        .sort({
          createdAt: -1,
        })
        .toArray()

    // ========================================================
    // REMOVE DUPLICATES
    // ========================================================

    const uniqueMedia =
      removeDuplicateMedia(
        media
      )

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      count:
        uniqueMedia.length,

      resourceType,

      data:
        uniqueMedia,
    })
  } catch (error) {
    console.error(
      '❌ Failed to fetch media by resource type:',
      error
    )

    next(error)
  }
}

// ============================================================
// GET MEDIA BY MEDIA TYPE / CATEGORY
//
// GET /api/media/category/memory
// GET /api/media/category/photo
// GET /api/media/category/quote
// GET /api/media/category/video
//
// IMPORTANT:
//
// Each category is completely independent.
//
// photo:
// ONLY mediaType = photo
//
// memory:
// ONLY mediaType = memory
//
// quote:
// ONLY mediaType = quote
//
// video:
// ONLY mediaType = video
//
// ============================================================

const getMediaByMediaType = async (
  req,
  res,
  next
) => {
  try {
    // ========================================================
    // NORMALIZE
    // ========================================================

    const mediaType =
      normalizeMediaType(
        req.params.mediaType
      )

    // ========================================================
    // VALIDATE
    // ========================================================

    if (
      !VALID_MEDIA_TYPES.includes(
        mediaType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Media type must be memory, photo, quote, or video',
      })
    }

    // ========================================================
    // DATABASE
    // ========================================================

    const db = getDb()

    // ========================================================
    // IMPORTANT:
    //
    // Exact category match.
    //
    // This prevents:
    //
    // photo → memory
    // photo → quote
    // memory → photo
    //
    // ========================================================

    const media =
      await db
        .collection('media')
        .find({
          mediaType: mediaType,
        })
        .sort({
          createdAt: -1,
        })
        .toArray()

    // ========================================================
    // REMOVE DUPLICATES
    // ========================================================

    const uniqueMedia =
      removeDuplicateMedia(
        media
      )

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      count:
        uniqueMedia.length,

      mediaType,

      data:
        uniqueMedia,
    })
  } catch (error) {
    console.error(
      '❌ Failed to fetch media by mediaType:',
      error
    )

    next(error)
  }
}

// ============================================================
// UPDATE MEDIA
// PUT /api/media/:id
//
// ADMIN ONLY
//
// Can update:
// - title
// - description
//
// mediaType cannot be changed here.
// ============================================================

const updateMedia = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
    } = req.params

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid media ID',
      })
    }

    // ========================================================
    // GET TITLE
    // ========================================================

    const title =
      typeof req.body.title === 'string'
        ? req.body.title.trim()
        : undefined

    // ========================================================
    // GET DESCRIPTION
    // ========================================================

    const description =
      typeof req.body.description === 'string'
        ? req.body.description.trim()
        : undefined

    // ========================================================
    // NOTHING TO UPDATE
    // ========================================================

    if (
      title === undefined &&
      description === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Nothing to update',
      })
    }

    // ========================================================
    // TITLE CANNOT BE EMPTY
    // ========================================================

    if (
      title !== undefined &&
      !title
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Media title cannot be empty',
      })
    }

    // ========================================================
    // BUILD UPDATE
    // ========================================================

    const updateFields = {}

    if (
      title !== undefined
    ) {
      updateFields.title =
        title
    }

    if (
      description !== undefined
    ) {
      updateFields.description =
        description
    }

    updateFields.updatedAt =
      new Date()

    // ========================================================
    // DATABASE
    // ========================================================

    const db = getDb()

    const result =
      await db
        .collection('media')
        .findOneAndUpdate(
          {
            _id:
              new ObjectId(id),
          },

          {
            $set:
              updateFields,
          },

          {
            returnDocument:
              'after',
          }
        )

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          'Media not found',
      })
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        'Media updated successfully',

      data:
        result,
    })
  } catch (error) {
    console.error(
      '❌ Media update error:',
      error
    )

    next(error)
  }
}

// ============================================================
// DELETE MEDIA
// DELETE /api/media/:id
//
// ADMIN ONLY
//
// Deletes:
// 1. Cloudinary file
// 2. MongoDB document
// ============================================================

const deleteMedia = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
    } = req.params

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid media ID',
      })
    }

    const db = getDb()

    // ========================================================
    // FIND MEDIA
    // ========================================================

    const media =
      await db
        .collection('media')
        .findOne({
          _id:
            new ObjectId(id),
        })

    // ========================================================
    // MEDIA NOT FOUND
    // ========================================================

    if (!media) {
      return res.status(404).json({
        success: false,
        message:
          'Media not found',
      })
    }

    // ========================================================
    // DELETE CLOUDINARY FILE
    // ========================================================

    if (media.publicId) {
      try {
        await deleteFromCloudinary({
          publicId:
            media.publicId,

          resourceType:
            media.resourceType,
        })
      } catch (
        cloudinaryError
      ) {
        console.error(
          '❌ Cloudinary deletion failed:',
          cloudinaryError
        )

        return res.status(500).json({
          success: false,
          message:
            'Failed to delete media from Cloudinary. MongoDB record was not deleted.',
        })
      }
    }

    // ========================================================
    // DELETE MONGODB DOCUMENT
    // ========================================================

    const deleteResult =
      await db
        .collection('media')
        .deleteOne({
          _id:
            new ObjectId(id),
        })

    // ========================================================
    // DELETE FAILED
    // ========================================================

    if (
      deleteResult.deletedCount === 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          'Cloudinary file was deleted, but MongoDB record could not be deleted.',
      })
    }

    // ========================================================
    // SUCCESS MESSAGE
    // ========================================================

    let successMessage =
      'Memory deleted successfully'

    if (
      media.mediaType === 'photo'
    ) {
      successMessage =
        'Photo deleted successfully'
    }

    if (
      media.mediaType === 'quote'
    ) {
      successMessage =
        'Quote image deleted successfully'
    }

    if (
      media.mediaType === 'video'
    ) {
      successMessage =
        'Video deleted successfully'
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        successMessage,

      data: {
        _id:
          media._id,

        title:
          media.title,

        mediaType:
          media.mediaType,

        resourceType:
          media.resourceType,

        publicId:
          media.publicId,
      },
    })
  } catch (error) {
    console.error(
      '❌ Media delete error:',
      error
    )

    next(error)
  }
}

// ============================================================
// EXPORT
// ============================================================

export {
  uploadMedia,
  getAllMedia,
  getMediaByType,
  getMediaByMediaType,
  updateMedia,
  deleteMedia,
}