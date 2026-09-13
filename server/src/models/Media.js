// ============================================================
// CREATE MEDIA DOCUMENT
//
// Used before saving uploaded media information to MongoDB.
//
// mediaType:
// - memory → Normal memory image
// - photo  → Dedicated photo collection image
// - quote  → Quote image
// - video  → Video
//
// resourceType:
// - image
// - video
// ============================================================

const createMediaDocument = ({
  title,
  description,
  url,
  publicId,
  resourceType,
  mediaType,
  uploadedBy,
}) => {
  const now = new Date()

  // ==========================================================
  // VALID MEDIA TYPES
  // ==========================================================

  const allowedMediaTypes = [
    'memory',
    'photo',
    'quote',
    'video',
  ]

  // ==========================================================
  // DETERMINE MEDIA TYPE
  //
  // If mediaType is provided:
  //   use it
  //
  // Otherwise:
  //   image → memory
  //   video → video
  //
  // This keeps older upload logic compatible.
  // ==========================================================

  let finalMediaType =
    typeof mediaType === 'string'
      ? mediaType.trim().toLowerCase()
      : ''

  if (!finalMediaType) {
    finalMediaType =
      resourceType === 'video'
        ? 'video'
        : 'memory'
  }

  // ==========================================================
  // SAFETY CHECK
  //
  // Invalid mediaType will fall back to the appropriate
  // default type based on resourceType.
  // ==========================================================

  if (
    !allowedMediaTypes.includes(
      finalMediaType
    )
  ) {
    finalMediaType =
      resourceType === 'video'
        ? 'video'
        : 'memory'
  }

  // ==========================================================
  // RESOURCE TYPE SAFETY
  //
  // Only two Cloudinary resource types are allowed:
  //
  // image
  // video
  //
  // Anything other than video becomes image.
  // ==========================================================

  const finalResourceType =
    resourceType === 'video'
      ? 'video'
      : 'image'

  // ==========================================================
  // MEDIA TYPE + RESOURCE TYPE SAFETY
  //
  // Video file can only be:
  //   mediaType → video
  //
  // Image file can only be:
  //   mediaType → memory
  //   mediaType → photo
  //   mediaType → quote
  // ==========================================================

  if (finalResourceType === 'video') {
    finalMediaType = 'video'
  }

  if (
    finalResourceType === 'image' &&
    finalMediaType === 'video'
  ) {
    finalMediaType = 'memory'
  }

  // ==========================================================
  // CREATE DOCUMENT
  // ==========================================================

  return {
    // ========================================================
    // MEDIA INFORMATION
    // ========================================================

    title:
      typeof title === 'string'
        ? title.trim()
        : '',

    description:
      typeof description === 'string'
        ? description.trim()
        : '',

    // ========================================================
    // MEDIA CATEGORY
    //
    // memory → Normal memory image
    // photo  → Dedicated Photos collection image
    // quote  → Quote image
    // video  → Video
    // ========================================================

    mediaType: finalMediaType,

    // ========================================================
    // CLOUDINARY INFORMATION
    // ========================================================

    url,

    publicId,

    resourceType: finalResourceType,

    // ========================================================
    // UPLOADER INFORMATION
    // ========================================================

    uploadedBy:
      uploadedBy || null,

    // ========================================================
    // TIMESTAMPS
    // ========================================================

    createdAt: now,

    updatedAt: now,
  }
}

export default createMediaDocument